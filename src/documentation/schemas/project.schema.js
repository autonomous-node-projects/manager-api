const jsonSchema = {
 "$schema": "http://json-schema.org/draft-04/schema#",
 "description": "test",
 "type": "object",
 "properties": {
  "_id": {
   "type": "string",
   "minLength": 1
  },
  "name": {
   "type": "string",
   "minLength": 1
  },
  "dataDirectory": {
   "type": "string",
   "minLength": 1
  },
  "scripts": {
   "type": "array",
   "minItems": 1,
   "items": [
    {}
   ]
  },
  "schedules": {
   "type": "array",
   "uniqueItems": true,
   "minItems": 1,
   "items": {
    "required": [
     "_id",
     "scriptName",
     "nextRun"
    ],
    "properties": {
     "every": {
      "type": "object",
      "properties": {
       "value": {
        "type": "number"
       },
       "timeType": {
        "type": "string",
        "minLength": 1
       }
      },
      "required": [
       "value",
       "timeType"
      ]
     },
     "_id": {
      "type": "string",
      "minLength": 1
     },
     "scriptName": {
      "type": "string",
      "minLength": 1
     },
     "nextRun": {
      "type": "string",
      "minLength": 1
     }
    }
   }
  },
  "__v": {
   "type": "number"
  }
 },
 "required": [
  "_id",
  "name",
  "dataDirectory",
  "scripts",
  "schedules",
  "__v"
 ]
}; 
const openAPISchema = {
    "description": "test",
    "type": "object",
    "properties": {
        "_id": {
            "type": "string",
            "minLength": 1
        },
        "name": {
            "type": "string",
            "minLength": 1
        },
        "dataDirectory": {
            "type": "string",
            "minLength": 1
        },
        "scripts": {
            "type": "array",
            "minItems": 1,
            "items": [
                {}
            ]
        },
        "schedules": {
            "type": "array",
            "uniqueItems": true,
            "minItems": 1,
            "items": {
                "required": [
                    "_id",
                    "scriptName",
                    "nextRun"
                ],
                "properties": {
                    "every": {
                        "type": "object",
                        "properties": {
                            "value": {
                                "type": "number"
                            },
                            "timeType": {
                                "type": "string",
                                "minLength": 1
                            }
                        },
                        "required": [
                            "value",
                            "timeType"
                        ]
                    },
                    "_id": {
                        "type": "string",
                        "minLength": 1
                    },
                    "scriptName": {
                        "type": "string",
                        "minLength": 1
                    },
                    "nextRun": {
                        "type": "string",
                        "minLength": 1
                    }
                }
            }
        },
        "__v": {
            "type": "number"
        }
    },
    "required": [
        "_id",
        "name",
        "dataDirectory",
        "scripts",
        "schedules",
        "__v"
    ]
}; 
module.exports = { jsonSchema, openAPISchema };