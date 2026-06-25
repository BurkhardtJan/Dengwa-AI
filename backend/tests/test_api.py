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