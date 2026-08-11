# Food Rescue Network

Food Rescue Network is a full-stack platform designed to connect restaurants and businesses that have surplus food with NGOs and volunteers, streamlining the food donation lifecycle to reduce waste and fight hunger.

## Problem
Restaurants, hotels, hostels, supermarkets, and wedding halls often generate edible surplus food that goes to waste while nearby NGOs and communities face food insecurity. 

## Solution
This platform provides a streamlined workflow:
1. **Business** creates a surplus-food donation.
2. **NGOs** discover nearby available donations and request a pickup.
3. **Volunteer** is assigned and accepts the pickup.
4. **Volunteer** collects and delivers the food.
5. **NGO** confirms delivery.
6. **System** records rescued food and impact analytics.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, React Router, Axios
- **Backend**: Node.js, Express.js, REST APIs
- **Database**: PostgreSQL, Prisma ORM
- **Authentication**: JWT, bcrypt, Role-Based Access Control
- **Real-Time**: Socket.io
- **Maps**: Leaflet, OpenStreetMap
- **Images**: Cloudinary
- **DevOps**: Docker, Docker Compose, GitHub Actions

## Installation
*(Detailed installation instructions will be added during development)*

## Documentation
Please refer to the `docs/` directory for detailed documentation:
- [Architecture](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Database Schema](docs/database.md)
- [Deployment Guide](docs/deployment.md)

## License
MIT