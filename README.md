# Trenuri Romania API

This is the API for our project, Trenuri Romania (https://github.com/CristiMacovei/Trenuri-Romania).

The API is publicly hosted at https://api.project-trenuri-romania.cristimacovei.dev.

All responses are in JSON format.

## API Endpoints

### /auth
This endpoint is used to verify a token and keep the corresponding user authenticated without the need of providing their password and username.

### /login
This endpoint is used to log a user in. Accepts POST requests containing the user's credentials.

### /signup
This endpoint is used to create a new user account. Accepts POST requests containing the user's credentials.

### /history
This endpoint is used to fetch a specific user's history. Accepts GET requests with the token embedded in the authorization header.

### /data/stations
Returns the stations dataset.

### /data/graph
Returns the graph dataset.

### /path/v2/
This endpoint is used to find the path between two stations. Accepts POST requests providing the two station ids and a valid user token embedded in the authorization header.

