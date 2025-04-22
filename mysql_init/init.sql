-- Erstellt die Datenbank, falls sie noch nicht existiert
CREATE DATABASE IF NOT EXISTS wiseekr CHARACTER SET utf8 COLLATE utf8_bin;

-- Löscht alten Benutzer (falls vorhanden)
DROP USER IF EXISTS 'wiseekr'@'%';

-- Legt den Benutzer mit neuem Passwort an
CREATE USER 'wiseekr'@'%' IDENTIFIED BY 'wiseekr654321!';

-- Erteilt alle Rechte auf die wiseekr-Datenbank
GRANT ALL PRIVILEGES ON wiseekr.* TO 'wiseekr'@'%';

-- Änderungen übernehmen
FLUSH PRIVILEGES;