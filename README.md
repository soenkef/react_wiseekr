# Getting Started with Create React App

# README for react-wiseekr and wiseekr-api here

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Python API
Download Wiseekr API in the folder in which react-wiseekr is saved
`git clone https://github.com/miguelgrinberg/wiseekr-api.git`
Use it with .env files in API-folder and react-wiseekr folder!!!!

# project - wiseekr-api
## https://github.com/soenkef/react_wiseekr-api
git@github.com:soenkef/react_wiseekr-api.git


# react_wiseekr
# rename wiseekr-api?
add files in wiseekr-api for handling other functions in the future

# npm stuff
npm install (to install all dependencies)
npm start 
npx run build (baut statische files für späteres hosting in build/)

npm install react-router-dom@6 (to fix jest-test)
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @testing-library/dom \
  jest


npm install --save-dev @babel/plugin-proposal-private-property-in-object (to fix warning)
npm install react-router-dom@6 (downgrade to fix jest-test)
npx serve -s build (startet applikation lokal im Verzeichnis build)

# FRONTEND-changes saving (here is the docker deployment included)


npm run deploy

### rename all microblog stuff to wiseekr

# install and configure mysql/mariadb-server
sudo apt install mariadb-server
sudo mysql_secure_installation
sudo mysql -u root -p
create database wiseekr character set utf8 collate utf8_bin;
create user 'wiseekr'@'localhost' identified by '<password>';
grant all privileges on wiseekr.* to 'wiseekr'@'localhost';
flush privileges;
quit;

# prepare for docker
## https://github.com/soenkef/react_wiseekr

# install docker and docker-compose
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# network manager tools - to imitate airodump for output checks
apt  install network-manager

# netstat install
sudo apt install net-tools


#################################


# steps for installation on ubuntu virtualbox machine
sudo apt install openssh-server

sudo apt install git npm

# prepare for github actions - create ssh key and save in github
cd /home/<User>
ssh-keygen -t ed25519 -C "mantu@gmx.de"
cat /home/<User>/.ssh/id_ed25519.pub
git clone git@github.com:soenkef/react_wiseekr-api.git
git clone git@github.com:soenkef/react_wiseekr.git
## set up .env -files
vim /home/<user>/react-wiseekr/.env
#REACT_APP_BASE_API_URL= # docker-compose runs with .env.production
REACT_APP_BASE_API_URL='http://localhost:5000'

vim /home/<user>/react-wiseekr/.env.api
# for docker-compose
#DATABASE_URL=mysql+pymysql://wiseekr:wiseekr654321@db/wiseekr
# for local stuff
DATABASE_URL='mysql+pymysql://wiseekr:wiseekr654321@localhost:3307/wiseekr'

vim /home/<user>/react-wiseekr/.env.production
# this is for docker environment
REACT_APP_BASE_API_URL=

vim /home/<user>/react-wiseekr-api/.env
#DATABASE_URL='mysql+pymysql://wiseekr:wiseekr654@db/wiseekr' # for docker-compose
DATABASE_URL='mysql+pymysql://wiseekr:wiseekr654321@localhost:3307/wiseekr'

DISABLE_AUTH=false
MAIL_SERVER=mail.gmx.net
MAIL_PORT=465
MAIL_USE_TLS=1
MAIL_USERNAME=mantu@gmx.de
MAIL_PASSWORD=G00fys0enke01!
MAIL_DEFAULT_SENDER=wiseekr@wiseekr.me


vim /home/<user>/react-wiseekr-api/.env.api
DISABLE_AUTH=false
MAIL_SERVER=mail.gmx.net
MAIL_PORT=465
MAIL_USE_TLS=1
MAIL_USERNAME=mantu@gmx.de
MAIL_PASSWORD=G00fys0enke01!
MAIL_DEFAULT_SENDER=wiseekr@wiseekr.me

vim /home/<user>/react-wiseekr-api/.flaskenv
FLASK_APP=wiseekr.py
FLASK_DEBUG=1


## docker-added mariadb to docker-compose.yml in wiseekr-api .env
DATABASE_URL='mysql+pymysql://wiseekr:wiseekr654321@db/wiseekr'


# install docker and docker-compose
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin





######################################################

## docker tabularasa
# Stoppe und entferne alle laufenden Container
docker ps -aq | xargs -r docker stop
docker ps -aq | xargs -r docker rm -f

# Entferne alle Images
docker images -aq | xargs -r docker rmi -f

# Entferne alle Volumes
docker volume ls -q | xargs -r docker volume rm -f

# Entferne alle Netzwerke (außer default, bridge, host)
docker network ls -q | xargs -r docker network rm

# Optional: auch Docker Compose-Projekte aufräumen (falls nicht schon durch obiges erledigt)
docker compose down -v --remove-orphans

## oneliner
docker stop $(docker ps -aq) 2>/dev/null && \
docker rm -f $(docker ps -aq) 2>/dev/null && \
docker rmi -f $(docker images -aq) 2>/dev/null && \
docker volume rm -f $(docker volume ls -q) 2>/dev/null && \
docker network rm $(docker network ls -q | grep -v "bridge\|host\|none") 2>/dev/null

# check
docker system prune -a --volumes -f  # falls noch Reste da sind
docker info                         # check, ob alles leer ist


# wiseekr-api

[![Build status](https://github.com/miguelgrinberg/wiseekr-api/workflows/build/badge.svg)](https://github.com/miguelgrinberg/wiseekr-api/actions) [![codecov](https://codecov.io/gh/miguelgrinberg/wiseekr-api/branch/main/graph/badge.svg)](https://codecov.io/gh/miguelgrinberg/wiseekr-api)

A modern (as of 2024) Flask API back end.

## Deploy to Heroku

Click the button below to deploy the application directly to your Heroku
account.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/miguelgrinberg/wiseekr-api/tree/heroku)

## Deploy on your Computer

### Setup

Follow these steps if you want to run this application on your computer, either
in a Docker container or as a standalone Python application.

```bash
git clone https://github.com/miguelgrinberg/wiseekr-api
cd wiseekr-api
cp .env.example .env
```

Open the new `.env` file and enter values for the configuration variables.

### Run with Docker

To start:

```bash
docker-compose up -d
```

The application runs on port 5000 on your Docker host. You can access the API
documentation on the `/docs` URL (i.e. `http://localhost:5000/docs` if you are
running Docker locally).

To populate the database with some randomly generated data:

```bash
docker-compose run --rm wiseekr-api bash -c "flask fake users 10 && flask fake posts 100"
```

To stop the application:

```bash
docker-compose down
```

### Run locally

Set up a Python 3 virtualenv and install the dependencies on it:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create the database and populate it with some randomly generated data:

```bash
alembic upgrade head
flask fake users 10
flask fake posts 100
```

Run the application with the Flask development web server:

```bash
flask run
```

The application runs on `localhost:5000`. You can access the API documentation
at `http://localhost:5000/docs`.

## Troubleshooting

On macOS Monterey and newer, Apple decided to use port 5000 for its AirPlay
service, which means that the wiseekr API server will not be able to run on
this port. There are two possible ways to solve this problem:

1. Disable the AirPlay Receiver service. To do this, open the System
Preferences, go to "Sharing" and uncheck "AirPlay Receiver".
2. Move wiseekr API to another port:
    - If you are running wiseekr API with Docker, add a
    `wiseekr_API_PORT=4000` line to your *.env* file. Change the 4000 to your
    desired port number.
    - If you are running wiseekr API with Python, start the server with the
    command `flask run --port=4000`.
# react_wiseekr-api

# Updated Database
## create manage.py in root
from flask.cli import FlaskGroup
from api.app import create_app, db
from flask_migrate import MigrateCommand

app = create_app()
cli = FlaskGroup(app)

### Migrate-Befehle hinzufügen
cli.add_command('db', MigrateCommand)

if __name__ == '__main__':
    cli()

## export Environment variables - do in boot.sh
export FLASK_APP=app:create_app
export FLASK_ENV=development

## remove migrations folder
rm -rf migrations/

## eventually must remove alembic_version table from database table
DROP TABLE alembic_version;

## reinit and build database
rm -r migrations/
flask db init
flask db stamp head
flask db migrate -m "initial schema after reset"
flask db upgrade