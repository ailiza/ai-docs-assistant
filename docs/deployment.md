# Deployment Guide

## How to Deploy a New Service at Spotify

All services at Spotify are deployed using our internal CLI tool called `spotctl`.

### Steps to Deploy

1. Make sure your code is merged to main branch
2. Run `spotctl build` to create a Docker container
3. Run `spotctl deploy --env staging` to deploy to staging first
4. Run smoke tests with `spotctl test --env staging`
5. If tests pass, run `spotctl deploy --env production`

### Rollback

If something goes wrong in production, run `spotctl rollback --env production` to instantly revert to the previous version.

### Common Errors

- `Build failed: missing env vars` — check your `.env.example` file and make sure all variables are set
- `Deploy timeout` — your service took too long to start, check memory limits in `service.yaml`