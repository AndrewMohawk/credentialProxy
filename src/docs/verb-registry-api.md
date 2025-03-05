# Verb Registry API Documentation

The Verb Registry API provides endpoints for managing and retrieving "verbs" - actions that can be controlled by policies. Verbs are categorized by scope (global, plugin, credential) and provide the building blocks for natural language policy creation.

## API Endpoints

### Get All Verbs

Retrieves all registered verbs with optional filtering.

**URL:** `/api/v1/verb-registry`

**Method:** `GET`

**Authentication Required:** Yes

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| scope | string | Filter by scope: `GLOBAL`, `PLUGIN`, or `CREDENTIAL` |
| pluginType | string | Filter by plugin type (for `PLUGIN` scope) |
| credentialType | string | Filter by credential type (for `CREDENTIAL` scope) |
| search | string | Search term to filter verbs by name or description |
| tags | string | Comma-separated list of tags to filter by |

**Response:**

```json
[
  {
    "id": "access_application",
    "name": "access application",
    "description": "Access an application",
    "scope": "GLOBAL",
    "operation": "access",
    "isDefault": true,
    "examples": ["If any application wants to access application then allow"]
  },
  {
    "id": "read_credential",
    "name": "read credential",
    "description": "Read credential values",
    "scope": "CREDENTIAL",
    "operation": "read",
    "isDefault": true,
    "examples": ["If any application wants to read credential then allow"]
  }
]
```

### Get Verb by ID

Retrieves a specific verb by its ID.

**URL:** `/api/v1/verb-registry/:id`

**Method:** `GET`

**Authentication Required:** Yes

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | The ID of the verb to retrieve |

**Response:**

```json
{
  "id": "access_application",
  "name": "access application",
  "description": "Access an application",
  "scope": "GLOBAL",
  "operation": "access",
  "isDefault": true,
  "examples": ["If any application wants to access application then allow"]
}
```

### Register a Verb

Registers a new verb or updates an existing one.

**URL:** `/api/v1/verb-registry`

**Method:** `POST`

**Authentication Required:** Yes (Admin only)

**Request Body:**

```json
{
  "id": "custom_verb",
  "name": "custom verb",
  "description": "A custom verb for testing",
  "scope": "GLOBAL",
  "operation": "custom",
  "parameters": [
    {
      "name": "param1",
      "description": "A test parameter",
      "type": "string",
      "required": true
    }
  ],
  "tags": ["custom", "test"],
  "examples": ["If any application wants to custom verb then allow"]
}
```

**Response:**

```json
{
  "id": "custom_verb",
  "name": "custom verb",
  "description": "A custom verb for testing",
  "scope": "GLOBAL",
  "operation": "custom",
  "parameters": [
    {
      "name": "param1",
      "description": "A test parameter",
      "type": "string",
      "required": true
    }
  ],
  "tags": ["custom", "test"],
  "examples": ["If any application wants to custom verb then allow"]
}
```

### Unregister a Verb

Removes a verb from the registry.

**URL:** `/api/v1/verb-registry/:id`

**Method:** `DELETE`

**Authentication Required:** Yes (Admin only)

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | The ID of the verb to unregister |

**Response:**

```
204 No Content
```

### Register Plugin Verbs

Registers multiple verbs for a specific plugin type.

**URL:** `/api/v1/verb-registry/plugin/:pluginType`

**Method:** `POST`

**Authentication Required:** Yes (Admin or Plugin)

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| pluginType | string | The type of plugin |

**Request Body:**

```json
[
  {
    "id": "plugin_verb_1",
    "name": "Plugin Verb 1",
    "description": "A plugin verb",
    "operation": "plugin1"
  },
  {
    "id": "plugin_verb_2",
    "name": "Plugin Verb 2",
    "description": "Another plugin verb",
    "operation": "plugin2"
  }
]
```

**Response:**

```json
[
  {
    "id": "test-plugin:plugin_verb_1",
    "name": "Plugin Verb 1",
    "description": "A plugin verb",
    "scope": "PLUGIN",
    "pluginType": "test-plugin",
    "operation": "plugin1"
  },
  {
    "id": "test-plugin:plugin_verb_2",
    "name": "Plugin Verb 2",
    "description": "Another plugin verb",
    "scope": "PLUGIN",
    "pluginType": "test-plugin",
    "operation": "plugin2"
  }
]
```

### Register Credential Verbs

Registers multiple verbs for a specific credential type.

**URL:** `/api/v1/verb-registry/credential/:credentialType`

**Method:** `POST`

**Authentication Required:** Yes (Admin only)

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| credentialType | string | The type of credential |

**Request Body:**

```json
[
  {
    "id": "credential_verb_1",
    "name": "Credential Verb 1",
    "description": "A credential verb",
    "operation": "credential1"
  },
  {
    "id": "credential_verb_2",
    "name": "Credential Verb 2",
    "description": "Another credential verb",
    "operation": "credential2"
  }
]
```

**Response:**

```json
[
  {
    "id": "test-credential:credential_verb_1",
    "name": "Credential Verb 1",
    "description": "A credential verb",
    "scope": "CREDENTIAL",
    "credentialType": "test-credential",
    "operation": "credential1"
  },
  {
    "id": "test-credential:credential_verb_2",
    "name": "Credential Verb 2",
    "description": "Another credential verb",
    "scope": "CREDENTIAL",
    "credentialType": "test-credential",
    "operation": "credential2"
  }
]
```

## Verb Object Structure

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the verb |
| name | string | Display name for the verb |
| description | string | Description of what the verb does |
| scope | string | The scope this verb applies to: `GLOBAL`, `PLUGIN`, or `CREDENTIAL` |
| operation | string | The underlying operation identifier |
| parameters | array | Optional parameters for the verb |
| pluginType | string | For `PLUGIN` scope, the type of plugin |
| credentialType | string | For `CREDENTIAL` scope, the type of credential |
| tags | array | Optional tags for categorization/filtering |
| examples | array | Example usage in natural language |
| isDefault | boolean | Whether this is a default system verb |

### Parameter Object Structure

| Field | Type | Description |
|-------|------|-------------|
| name | string | Parameter name |
| description | string | Description of the parameter |
| type | string | Parameter type: `string`, `number`, `boolean`, `object`, or `array` |
| required | boolean | Whether the parameter is required |
| defaultValue | any | Optional default value |
| options | array | For enum-like parameters, the valid options |
| validation | object | Optional validation rules |

## Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - The request was malformed or contained invalid parameters |
| 401 | Unauthorized - Authentication is required |
| 403 | Forbidden - The user does not have permission to perform this action |
| 404 | Not Found - The requested verb was not found |
| 500 | Internal Server Error - An error occurred on the server |

## Examples

### Filtering Verbs by Scope

```
GET /api/v1/verb-registry?scope=GLOBAL
```

### Searching for Verbs

```
GET /api/v1/verb-registry?search=access
```

### Filtering by Multiple Criteria

```
GET /api/v1/verb-registry?scope=PLUGIN&pluginType=aws&tags=security,cloud
```

## Integration with Policy System

Verbs registered in the Verb Registry can be used in the natural language policy builder to create policies. The verb's `operation` field maps to the underlying operation that will be evaluated by the policy engine.

For example, a policy created with the verb "access application" will be evaluated when an application attempts to perform the "access" operation. 