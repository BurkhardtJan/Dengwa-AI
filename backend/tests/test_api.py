import io
import uuid
import requests

BASE_URL = "http://localhost:8000"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def unique_username() -> str:
    return f"testuser_{uuid.uuid4().hex[:8]}"


def register_user(username: str, password: str = "testpassword123") -> requests.Response:
    return requests.post(f"{BASE_URL}/users/register", json={
        "username": username,
        "password": password,
        "native_language": "de"
    })


def login_user(username: str, password: str = "testpassword123") -> requests.Response:
    """Login uses OAuth2 form encoding, not JSON."""
    return requests.post(f"{BASE_URL}/users/login", data={
        "username": username,
        "password": password,
    })


def get_token(username: str, password: str = "testpassword123") -> str:
    """Register, login, return Bearer token."""
    register_user(username, password)
    response = login_user(username, password)
    return response.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def create_test_user_with_language(language: str = "Spanish") -> tuple:
    """Register user, add language, return (token, language_name)."""
    token = get_token(unique_username())
    requests.post(f"{BASE_URL}/languages",
        headers=auth_headers(token),
        json={"learning_language": language}
    )
    return token, language


def upload_test_media(token: str, language: str, title: str = "Test Media") -> requests.Response:
    """Upload a minimal text file as media, return response."""
    file_content = b"Este es un texto de prueba para aprender vocabulario en espanol."
    return requests.post(
        f"{BASE_URL}/media?lan={language}",
        headers=auth_headers(token),
        data={"title": title},
        files={"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    )


# ---------------------------------------------------------------------------
# System
# ---------------------------------------------------------------------------

def test_health_returns_healthy():
    """Health endpoint returns 200 and status healthy."""
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

def test_register_new_user_succeeds():
    """Registering a new user returns 200 and the username."""
    username = unique_username()
    response = register_user(username)
    assert response.status_code == 200
    assert response.json()["username"] == username


def test_register_duplicate_user_fails():
    """Registering the same username twice returns 409 Conflict."""
    username = unique_username()
    register_user(username)
    response = register_user(username)
    assert response.status_code == 409


def test_login_returns_access_token():
    """Login returns a JWT access token."""
    username = unique_username()
    register_user(username)
    response = login_user(username)
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password_fails():
    """Login with wrong password returns 400 (OAuth2 standard)."""
    username = unique_username()
    register_user(username)
    response = login_user(username, password="wrongpassword")
    assert response.status_code == 400


def test_get_me_returns_current_user():
    """Authenticated /users/me returns the correct username."""
    username = unique_username()
    token = get_token(username)
    response = requests.get(f"{BASE_URL}/users/me", headers=auth_headers(token))
    assert response.status_code == 200
    assert response.json()["username"] == username


def test_get_me_without_token_fails():
    """Unauthenticated /users/me returns 401."""
    response = requests.get(f"{BASE_URL}/users/me")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Languages
# ---------------------------------------------------------------------------

def test_create_language_succeeds():
    """Creating a language returns the language object."""
    token = get_token(unique_username())
    response = requests.post(f"{BASE_URL}/languages",
        headers=auth_headers(token),
        json={"learning_language": "Spanish", "proficiency_level": "A1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["learning_language"] == "Spanish"
    assert data["proficiency_level"] == "A1"


def test_get_languages_returns_list():
    """GET /languages returns a list."""
    token = get_token(unique_username())
    requests.post(f"{BASE_URL}/languages",
        headers=auth_headers(token),
        json={"learning_language": "French"}
    )
    response = requests.get(f"{BASE_URL}/languages", headers=auth_headers(token))
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 1


def test_get_languages_without_token_fails():
    """Unauthenticated GET /languages returns 401."""
    response = requests.get(f"{BASE_URL}/languages")
    assert response.status_code == 401


def test_languages_are_user_isolated():
    """Languages from user A are not visible to user B."""
    token_a = get_token(unique_username())
    token_b = get_token(unique_username())
    requests.post(f"{BASE_URL}/languages",
        headers=auth_headers(token_a),
        json={"learning_language": "Japanese"}
    )
    response = requests.get(f"{BASE_URL}/languages", headers=auth_headers(token_b))
    assert response.status_code == 200
    languages = [l["learning_language"] for l in response.json()]
    assert "Japanese" not in languages


def test_delete_language_succeeds():
    """Deleting an existing language returns 200."""
    token = get_token(unique_username())
    create = requests.post(f"{BASE_URL}/languages",
        headers=auth_headers(token),
        json={"learning_language": "Italian"}
    )
    lang = create.json()["learning_language"]
    response = requests.delete(f"{BASE_URL}/languages/{lang}", headers=auth_headers(token))
    assert response.status_code == 200


# ---------------------------------------------------------------------------
# Vocabularies
# ---------------------------------------------------------------------------

def test_create_vocabulary_succeeds():
    """Creating a vocabulary entry returns the word."""
    token = get_token(unique_username())
    requests.post(f"{BASE_URL}/languages",
        headers=auth_headers(token),
        json={"learning_language": "Spanish"}
    )
    response = requests.post(f"{BASE_URL}/vocabularies?lan=Spanish",
        headers=auth_headers(token),
        json={"word": "hola", "translation": "hello"}
    )
    assert response.status_code == 200
    assert response.json()["word"] == "hola"


def test_get_vocabularies_returns_list():
    """GET /vocabularies returns a list."""
    token = get_token(unique_username())
    requests.post(f"{BASE_URL}/languages",
        headers=auth_headers(token),
        json={"learning_language": "Spanish"}
    )
    requests.post(f"{BASE_URL}/vocabularies?lan=Spanish",
        headers=auth_headers(token),
        json={"word": "gracias"}
    )
    response = requests.get(f"{BASE_URL}/vocabularies", headers=auth_headers(token))
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_update_vocabulary_succeeds():
    """Updating a vocabulary entry returns updated data."""
    token = get_token(unique_username())
    requests.post(f"{BASE_URL}/languages",
        headers=auth_headers(token),
        json={"learning_language": "Spanish"}
    )
    create = requests.post(f"{BASE_URL}/vocabularies?lan=Spanish",
        headers=auth_headers(token),
        json={"word": "adios"}
    )
    vocab_id = create.json()["id"]
    response = requests.put(f"{BASE_URL}/vocabularies/{vocab_id}",
        headers=auth_headers(token),
        json={"translation": "goodbye"}
    )
    assert response.status_code == 200
    assert response.json()["translation"] == "goodbye"


def test_delete_vocabulary_succeeds():
    """Deleting a vocabulary entry returns 200."""
    token = get_token(unique_username())
    requests.post(f"{BASE_URL}/languages",
        headers=auth_headers(token),
        json={"learning_language": "Spanish"}
    )
    create = requests.post(f"{BASE_URL}/vocabularies?lan=Spanish",
        headers=auth_headers(token),
        json={"word": "por favor"}
    )
    vocab_id = create.json()["id"]
    response = requests.delete(f"{BASE_URL}/vocabularies/{vocab_id}", headers=auth_headers(token))
    assert response.status_code == 200


# ---------------------------------------------------------------------------
# Media
# ---------------------------------------------------------------------------

def test_upload_media_succeeds():
    """Uploading a file returns media object with correct title."""
    token, language = create_test_user_with_language()
    response = upload_test_media(token, language)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Media"
    assert "id" in data


def test_get_media_returns_list():
    """GET /media returns a list containing the uploaded file."""
    token, language = create_test_user_with_language()
    upload_test_media(token, language)
    response = requests.get(f"{BASE_URL}/media", headers=auth_headers(token))
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 1


def test_get_media_filtered_by_language():
    """GET /media?lan= returns only media for that language."""
    token, language = create_test_user_with_language("French")
    upload_test_media(token, language, title="French Media")
    response = requests.get(f"{BASE_URL}/media?lan=French", headers=auth_headers(token))
    assert response.status_code == 200
    assert all(m["title"] == "French Media" for m in response.json())


def test_get_single_medium_succeeds():
    """GET /media/{id} returns the correct medium."""
    token, language = create_test_user_with_language()
    upload = upload_test_media(token, language)
    media_id = upload.json()["id"]
    response = requests.get(f"{BASE_URL}/media/{media_id}", headers=auth_headers(token))
    assert response.status_code == 200
    assert response.json()["id"] == media_id


def test_get_single_medium_wrong_user_fails():
    """GET /media/{id} from another user returns 404."""
    token_a, language = create_test_user_with_language()
    token_b = get_token(unique_username())
    upload = upload_test_media(token_a, language)
    media_id = upload.json()["id"]
    response = requests.get(f"{BASE_URL}/media/{media_id}", headers=auth_headers(token_b))
    assert response.status_code == 404


def test_delete_medium_succeeds():
    """Deleting a medium returns 200 and it's no longer accessible."""
    token, language = create_test_user_with_language()
    upload = upload_test_media(token, language)
    media_id = upload.json()["id"]
    delete = requests.delete(f"{BASE_URL}/media/{media_id}", headers=auth_headers(token))
    assert delete.status_code == 200
    get = requests.get(f"{BASE_URL}/media/{media_id}", headers=auth_headers(token))
    assert get.status_code == 404


def test_media_without_token_fails():
    """GET /media without token returns 401."""
    response = requests.get(f"{BASE_URL}/media")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Chats
# ---------------------------------------------------------------------------

def test_create_chat_succeeds():
    """Creating a chat for a medium returns chat object."""
    token, language = create_test_user_with_language()
    upload = upload_test_media(token, language)
    media_id = upload.json()["id"]
    response = requests.post(f"{BASE_URL}/chats?media_id={media_id}", headers=auth_headers(token))
    assert response.status_code == 200
    data = response.json()
    assert data["media_id"] == media_id
    assert data["user_id"] is not None


def test_get_chats_returns_list():
    """GET /chats returns list with created chat."""
    token, language = create_test_user_with_language()
    upload = upload_test_media(token, language)
    media_id = upload.json()["id"]
    requests.post(f"{BASE_URL}/chats?media_id={media_id}", headers=auth_headers(token))
    response = requests.get(f"{BASE_URL}/chats", headers=auth_headers(token))
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 1


def test_get_chat_history_empty_on_new_chat():
    """New chat has empty history."""
    token, language = create_test_user_with_language()
    upload = upload_test_media(token, language)
    media_id = upload.json()["id"]
    chat = requests.post(f"{BASE_URL}/chats?media_id={media_id}", headers=auth_headers(token))
    chat_id = chat.json()["id"]
    response = requests.get(f"{BASE_URL}/chats/{chat_id}", headers=auth_headers(token))
    assert response.status_code == 200
    assert response.json() == []


def test_delete_chat_succeeds():
    """Deleting a chat returns 200."""
    token, language = create_test_user_with_language()
    upload = upload_test_media(token, language)
    media_id = upload.json()["id"]
    chat = requests.post(f"{BASE_URL}/chats?media_id={media_id}", headers=auth_headers(token))
    chat_id = chat.json()["id"]
    response = requests.delete(f"{BASE_URL}/chats/{chat_id}", headers=auth_headers(token))
    assert response.status_code == 200


def test_chats_without_token_fails():
    """GET /chats without token returns 401."""
    response = requests.get(f"{BASE_URL}/chats")
    assert response.status_code == 401


def test_create_chat_invalid_media_fails():
    """Creating a chat with non-existent media_id returns 404."""
    token = get_token(unique_username())
    fake_id = uuid.uuid4()
    response = requests.post(f"{BASE_URL}/chats?media_id={fake_id}", headers=auth_headers(token))
    assert response.status_code == 404