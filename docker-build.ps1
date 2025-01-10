# Enable Docker BuildKit
$env:DOCKER_BUILDKIT = 1

# Read the .env file and convert it to a hashtable
$envVars = @{}
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $envVars[$matches[1]] = $matches[2]
    }
}

# Build the Docker image with secret
docker build --secret id=env,src=.env -t bitbots:latest .
