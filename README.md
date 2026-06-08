# Immersio-AI

## Description
Eine Anwendung zum Helfen zum Erlernen einer Sprache.
Es wird ein Medium (z.B. Untertitel, Buch, ...) hochgeladen.
Die KI erstellt eine Vokabelliste und hilft mit gesprächen, die Vokabeln zu bewerten und beizubringen.

# Endpoints

## POST Endpoint 1
Endpoint zum Hochladen eines Mediums

## POST Endpoint 2
Endpoint zum Chat der KI

## POST Endpoint 3
Zum Aktualisieren der Vokabellisten

## GET Endpoint 1
Endpoint zum fetchen der Vokabeln

## GET Endpoint 2
Statusrückmeldung zum Lernstand

## Database Requirements
PostgreSQL zum Speichern der Vokabeln und der Konversation
### Database Diagram

```mermaid
erDiagram
	chat_histories }o--|| chats : references
	chats }o--|| media : references
	language_learning }o--|| users : references
	language_learning ||--o{ media : references
	learning_progress }o--|| media : references
	media_vocabularies }o--|| media : references
	vocabularies ||--o{ media_vocabularies : references
	vocabularies }o--|| language_learning : references
	chats }o--|| users : references

	users {
		INTEGER id
		TEXT username
		TEXT native_language
	}

	media {
		INTEGER id
		TEXT title
		TEXT content_type
		TEXT file_path
		TEXT extracted_content
		INTEGER learning_id
	}

	vocabularies {
		INTEGER id
		INTEGER learning_id
		TEXT word
		TEXT translation
		TEXT context_sentence
		INTEGER status
		TEXT language
	}

	chats {
		INTEGER id
		INTEGER media_id
		INTEGER user_id
	}

	chat_histories {
		INTEGER id
		INTEGER chat_id
		TEXT message
		TIMESTAMP timestamp
		TEXT role
	}

	language_learning {
		INTEGER id
		INTEGER user_id
		TEXT learning_language
		TEXT proficiency_level
	}

	learning_progress {
		INTEGER id
		INTEGER media_id
		TEXT proficiency_level
		TEXT comment
	}

	media_vocabularies {
		INTEGER id
		INTEGER media_id
		INTEGER vocabulary_id
	}
```