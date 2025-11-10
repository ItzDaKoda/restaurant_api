# Assignment #5: Restaurant API 
This repository contains your starter code for the Restaurant API assignment focusing on middleware implementation and API documentation.

## Getting Started
1. Clone this repository to your local machine
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

## Assignment Overview
You will build a complete restaurant menu management API that demonstrates:
- **Custom middleware functions** for request logging and input validation
- **Professional API documentation** using Postman collections
- **Proper HTTP status codes** and error handling
- **Secure API endpoints** with input validation and data sanitization

## Required Dependencies
Install the following package for validation:
```bash
npm install express-validator
```

## Sample Data Structure
Your API will manage menu items with this structure:
```javascript
{
  id: 1,
  name: "Classic Burger",
  description: "Beef patty with lettuce, tomato, and cheese on a sesame seed bun",
  price: 12.99,
  category: "entree",
  ingredients: ["beef", "lettuce", "tomato", "cheese", "bun"],
  available: true
}
```

## Required API Endpoints
- `GET /api/menu` - Retrieve all menu items
- `GET /api/menu/:id` - Retrieve a specific menu item by ID
- `POST /api/menu` - Add a new menu item
- `PUT /api/menu/:id` - Update an existing menu item
- `DELETE /api/menu/:id` - Remove a menu item

## Middleware Requirements
Your API must implement two custom middleware functions:

### 1. Request Logging Middleware
- Log HTTP method, URL, and timestamp for all requests
- Log request body for POST and PUT requests
- Apply to all routes

### 2. Input Validation Middleware
- Validate all required fields using express-validator
- Apply to POST and PUT endpoints
- Return appropriate error messages for validation failures

## Validation Rules
- **Name**: Required string, minimum 3 characters
- **Description**: Required string, minimum 10 characters
- **Price**: Required number, greater than 0
- **Category**: Required string, must be one of: "appetizer", "entree", "dessert", "beverage"
- **Ingredients**: Required array with at least 1 ingredient
- **Available**: Boolean (defaults to true)

## HTTP Status Codes
Your API must return appropriate status codes:
- 200 for successful GET, PUT, DELETE requests
- 201 for successful POST requests
- 400 for validation errors
- 404 for not found errors

## Documentation Requirements
Create comprehensive API documentation using Postman:
- Create a collection with all API endpoints
- Add clear descriptions for each endpoint
- Include example request bodies for POST/PUT
- Save response examples for both success and error cases
- Publish documentation as a public website

## Testing Your Implementation
Use your Postman collection to test:
- All CRUD operations work correctly
- Middleware executes in proper order
- Validation middleware rejects invalid data
- Logging middleware captures all requests
- All endpoints return correct status codes

## Submission Requirements
Your final submission should include:
- Complete Express.js API with all CRUD endpoints
- Two custom middleware functions (logging and validation)
- Public URL to your Postman API documentation
- Clean, organized code with meaningful variable names

## File Structure
```
server.js
package.json
README.md
```

## Running the Server
Start your development server:
```bash
npm start
```
Your API will be available at `http://localhost:3000`