---
title: Intro to Docker
tags: redbrick, docker
slideOptions:
  theme: redbrick
---

## Docker: The Cloud in a box

---

## You want to get on the cloud?

---

![There is No Cloud](https://i.imgur.com/WO3P9w2.png)

---

## Containers

---

![container](https://i.imgur.com/mwFYmzx.jpg)

---

### Containers

- What is it
- How is it different to VM?
- LXC vs Docker

---

### Docker

- Well Documented<!-- .element: class="fragment" data-fragment-index="1" -->
- Lots of tools<!-- .element: class="fragment" data-fragment-index="2" -->
  - Docker-compose<!-- .element: class="fragment" data-fragment-index="3" -->
  - aws & google
    cloud<!-- .element: class="fragment" data-fragment-index="4" -->

---

# Running Docker

```bash
docker run --name my-nginx\
-v /etc/docker-configs/my-nginx/nginx.conf:/etc/nginx/nginx.conf:ro\
-d nginx
```

---

### What Does this do

- Pulls from [hub.docker.com](https://hub.docker.com)
- Start the container
- Name it
- And Create Volume

---

### What did he just say?

`docker pull` `docker run` Volumes

---

### This seems complicated

because it kind of is<!-- .element: class="fragment" data-fragment-index="1" -->

### Is there a better way?<!-- .element: class="fragment" data-fragment-index="2" -->

Yes Docker-compose<!-- .element: class="fragment" data-fragment-index="3" -->

---

### Docker Compose

```bash
docker-compose up
```

---

### That simple?

Not really Lets have a look at the docker-compose.yml

---

{%gist butlerx/ecf9562d78de19f9c13bc84b9ceef6ae %}

---

### Demo

#### Lets do it live

---

### NAH We actually prepared guide is at [www.redbrick.dcu.ie/help/tutorials/admin-docker](https://www.redbrick.dcu.ie/help/tutorials/admin-docker)
