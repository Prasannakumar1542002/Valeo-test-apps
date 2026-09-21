# Sample Demo Project: Calculator

This is a minimal sample project containing a simple math utility function that lacks robust validation checks. This repository is used to test the Agentic SDLC Platform agent's ability to autonomously retrieve, analyze, refactor, and verify code modifications.

## Current Backlog
- **Story-01**: Implement input validation in `calculate` inside `app/utils.py`. The arguments `a` and `b` must be numeric (int or float). If they are not, raise a `ValueError` with the message `"Inputs must be numeric"`.
- **Story-02**: Ensure there are comprehensive unit tests covering both valid inputs and validation failures.
