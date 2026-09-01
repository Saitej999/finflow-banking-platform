# FinFlow Copilot Instructions

FinFlow is an enterprise banking and transaction management platform.

## Technology Stack

Backend:
- Java 21
- Spring Boot
- Spring MVC
- Spring Data JPA
- PostgreSQL
- Spring Security
- Maven

Frontend:
- React
- TypeScript
- Vite
- React Router
- TanStack React Query
- Material UI

## Backend Architecture

Organize the application by business feature.

Example:

account/
controller/
service/
repository/
entity/
dto/
mapper/

Follow:

Controller -> Service -> Repository

## Java Rules

- Use Java 21.
- Use constructor dependency injection.
- Do not use field injection.
- Keep controllers thin.
- Put business logic in service classes.
- Use DTOs for API boundaries.
- Never expose JPA entities directly through REST APIs.
- Use BigDecimal for monetary values.
- Use Jakarta Bean Validation.
- Use global exception handling.
- Use appropriate database constraints.
- Write JUnit 5 tests for business logic.
- Use Mockito when appropriate.

## Frontend Rules

- Use React with TypeScript.
- Use functional components.
- Use TypeScript strict mode.
- Use TanStack React Query for server state.
- Keep API communication outside presentation components.
- Organize frontend functionality by feature.
- Define TypeScript interfaces/types for API contracts.

## Copilot Working Style

Before implementing major functionality:

1. Analyze the existing code.
2. Explain the proposed design.
3. Identify files that will change.
4. Explain important tradeoffs.
5. Only then implement the solution.

For generated Spring code:
- Explain important annotations.
- Explain dependency injection.
- Explain request flow.
- Explain transaction boundaries where applicable.

Do not introduce new dependencies without explaining why they are required.

Do not generate unrelated functionality.