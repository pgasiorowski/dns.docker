# Access container services by container name

Creates a tiny DNS server running in a container which
integrates with docker daemon providing additional
DNS resolution by container name.

In other words: Access your containers by http://container-name.docker


Tested on: Ubuntu 16 and Ubuntu 18

## Ubuntu setup 

* sudo apt-get install dnsmasq

* Create /etc/NetworkManager/dnsmasq.d/dns-local.conf with this content

  > server=/docker/172.0.0.53

  This will tell dns resolver that '.docker' is a local private domain,
  and 172.0.0.53 is the dns server to query for its records.

* Tell NetworkManager to use dnsmasq
  edit /etc/NetworkManager/NetworkManager.conf in section [main] add
  > dns=dnsmasq

* Restart network manager or reboot

## Docker setup

* Create custom subnet

  > docker network create --subnet 172.0.0.0/24 local

  This step is required as the dns.docker container needs a static IP

* create docker-compose.yml

  I tend to keep a global file in ~/development/docker-compose.yml and projects in ~/development/*
  eg. keep this repo is in ~/development/dns.docker  

```
version: '2'
services:
  dns.docker:
    build: ./dns.docker
    container_name: dns.docker
    restart: always
    networks:
      local:
        ipv4_address: 172.0.0.53
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

# Remember to create the subnet first first eg. `docker network create --subnet 172.0.0.0/24 local`
networks:
  local:
    external:
      name: local
```

* Run it

```
cd ~
docker-compose up -d dns.docker
docker-compose logs -f dns.docker
```

  Once launched, the docker daemon will keep it running between restarts thanks to 'restart: always'

## What next

Now you can add any docker services to the yml like so:

```
  mysql57.docker:
    container_name: mysql57.docker
    image: mysql/mysql-server:5.7.21
    restart: always
    environment:
      MYSQL_ALLOW_EMPTY_PASSWORD: 1
      MYSQL_ROOT_PASSWORD: ""
      MYSQL_ROOT_HOST: "%"
    networks:
      local:
```

Start, test it

> docker-compose up api.docker
> dig mysql57.docker

Your localhost as well as other containers in the 'local' subnet will be able to access these
containers easily by their container_name eg. mysql57.docker