# Coomono

An alternative frontend for coomer.su and kemono.su platforms.

## Overview

Coomono is a client-side only application that provides an alternative frontend for accessing content from coomer.su and kemono.su. The application uses the public API endpoints provided by these platforms to fetch and display data.

## Features

- Browse creators from both coomer.su and kemono.su
- View creator profiles and posts
- Search and filter creators by platform or name
- Client-side only, no server-side processing required

## Technology Stack

- React + TypeScript - Frontend framework
- Vite - Build tool
- GitHub Pages - Deployment

## Project Structure

```
src/
  ├── assets/          # Static assets
  ├── models/          # Data models
  ├── services/        # API services
  ├── types/           # TypeScript type definitions
  └── utils/           # Utility functions
```

## Development

To run the project locally:

```bash
# Install dependencies
yarn

# Start development server
yarn dev
```

## Building for Production

To build for production:

```bash
yarn build
```

The built files will be in the `dist` directory.

## Deployment

This project is configured for easy deployment to GitHub Pages. To deploy:

```bash
yarn build
# Then push the dist folder to gh-pages branch
```

## API Endpoints

The application interacts with the following main API endpoints:

- List of all creators: `https://coomer.su/api/v1/creators.txt`
- Creator profile: `https://coomer.su/api/v1/{platform}/user/{name}/profile`
- Creator posts: `https://coomer.su/api/v1/{platform}/user/{name}/posts`

Profile pictures and banners:

- Profile picture: `https://img.coomer.su/icons/{platform}/{name}`
- Banner: `https://img.coomer.su/banners/{platform}/{name}`

## License

MIT
