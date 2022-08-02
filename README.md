# About BeanBakery v15 project

This project is build on the Odoo v15 Community which customized to match the requirment for Online/ Offline Store.

## Requirements
I use this project for my own bakery business with the following requirements:
- ***My business need a website for customer to purchase our product***
- ***My business need a frontend page for my staff make order on the offline store***
- ***My business have manufactoring processes, Inventory processes and Accounting, so I need a tool to management these processes***


# Set up

- In this project, I can install BeanBakery v15 with 2 ways: **Non-docker** and **Docker**
- The Database default pass is: "P@assword#@!321"
- I use **AWS Lightsail Instance with Ubuntu 20.04** that's already had python 3.8.2 which is suitable with BeanBakery v15

## Docker setup
- Just install Docker and docker-compose on your VPS
- Run `docker-compose up -d` on the root of project
- Then setup the nginx proxy as mentioned below.

## Non-docker setup
1. Install Python 3.7 or 3.8 (if needed) and nodejs 
- 
- **For CentOS** 
    - `sudo dnf install python3 python3-dev libxml2-dev libxslt1-dev libldap2-dev libsasl2-dev libtiff5-dev libjpeg8-dev libopenjp2-7-dev zlib1g-dev libfreetype6-dev liblcms2-dev libwebp-dev libharfbuzz-dev libfribidi-dev libxcb1-dev libpq-dev libxslt-devel bzip2-devel openldap-devel git curl unzip -y `
- **For Ubuntu 22.4 and python 3.10** : 
  - `sudo apt update`
  - follow instruction of this site to install python3 (if needed): https://phoenixnap.com/kb/how-to-install-python-3-ubuntu , then install the following libraries: `sudo apt install  libxml2-dev libxslt1-dev libldap2-dev libsasl2-dev libtiff5-dev libjpeg8-dev libopenjp2-7-dev zlib1g-dev libfreetype6-dev liblcms2-dev libwebp-dev libharfbuzz-dev libfribidi-dev libxcb1-dev libpq-dev xfonts-75dpi git python3-pip python3.10-venv python3.10-dev `
- **For Ubuntu 20.4 and python 3.8** : 
  - `sudo apt update`
  - follow instruction of this site to install python3 (if needed): https://phoenixnap.com/kb/how-to-install-python-3-ubuntu , then install the following libraries: `sudo apt install  libxml2-dev libxslt1-dev libldap2-dev libsasl2-dev libtiff5-dev libjpeg8-dev libopenjp2-7-dev zlib1g-dev libfreetype6-dev liblcms2-dev libwebp-dev libharfbuzz-dev libfribidi-dev libxcb1-dev libpq-dev xfonts-75dpi git python3-pip python3.8-venv python3.8-dev `
- Install **pip and virtualenv** lib: 
  - `sudo python3 -m pip install pip`
  - `pip install virtualenv`


2. Install nodejs and  wkhtmltopdf:
    - **For CentOS** : `sudo dnf install https://github.com/wkhtmltopdf/wkhtmltopdf/releases/download/0.12.5/wkhtmltox-0.12.5-1.centos8.x86_64.rpm`
    - **For Ubuntu v22.04** :
      - `wget https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6.1-2/wkhtmltox_0.12.6.1-2.jammy_amd64.deb && sudo apt install ./wkhtmltox_0.12.6.1-2.jammy_amd64.deb` 
    - **For Ubuntu v20.04** : 
      - `wget https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6-1/wkhtmltox_0.12.6-1.focal_amd64.deb && sudo apt install ./wkhtmltox_0.12.6-1.focal_amd64.deb` 
    - **For Ubuntu v18.04** :
      - `sudo wget https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6-1/wkhtmltox_0.12.6-1.bionic_amd64.deb && sudo apt install ./wkhtmltox_0.12.6-1.bionic_amd64.deb`
    -  Install **nodejs** : 
      - `curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -`
      - `sudo apt-get install -y nodejs`
      - `sudo npm install -g rtlcss`
      

3. Install PostgresSQL
  - **For CentOS** 
    - `dnf install postgresql postgresql-server postgresql-contrib -y`
    - `postgresql-setup initdb`
    - `systemctl start postgresql`
    - `systemctl enable postgresql`
    - *Create Postgres user:* 
      - `sudo su - postgres `
      - `psql -U postgres`
      -  `CREATE ROLE beanbakery WITH CREATEDB LOGIN ENCRYPTED PASSWORD 'P@assword#@!321';` #Should use your own password, instead of "P@assword#@!321"
  - **For Ubuntu** 
    - *Create the file repository configuration:*
      - `sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list' `
    - *Import the repository signing key:*
      - `wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add - `
    - *Update the package lists:*
      - `sudo apt-get update`
    - *Install the latest version of PostgreSQL.If you want a specific version, use 'postgresql-12' or similar instead of 'postgresql':*
      - `sudo apt install postgresql postgresql-contrib -y`
    - *Create Postgres user:* 
      - `sudo su - postgres`
      - `psql -U postgres`
      - `CREATE ROLE beanbakery WITH CREATEDB LOGIN ENCRYPTED PASSWORD 'P@assword#@!321';`
    - You can check the Created Postges user by command `\du` and exit Postgres command line by 'Ctrl+D' then 'exit'

4. Clone source code and we need to create a new system user for BeanBakery v15 installation. Make sure the username is the same as the PostgreSQL user that we created in the previous step (username maybe different if you want it). In the following command, I use the ***'/home/beanbakery'*** folder is the home of the 'beanbakery' user. :
    - `sudo useradd -m -U -r -d /home/beanbakery -s /bin/bash beanbakery`
    - `sudo su - beanbakery`
    - `git clone https://github.com/Anhjean/beanbakery_v15.git ./beanbakery_app`
       or get from source : `git clone https://www.github.com/odoo/odoo --depth 1 --branch 15.0 ./beanbakery_app`
    - With this setting, the path for Odoo's addons will be ***/home/beanbakery/beanbakery_app/addons***

5. Install python dev by Virtual Env and setup BeanBakery v15
    - *install env lib:*
      - `cd ~/beanbakery_app && python3 -m venv beanbakery-venv`
      - `source beanbakery-venv/bin/activate`
    - *install odoo dependencies lib:*  
      - `pip install setuptools wheel`
      - `pip install -r ./requirements.txt`
    - However, we still need to install Odoo itself. You can use pip for this:
      - `  pip install -e /home/beanbakery/beanbakery_app/odoo`

6. Make BeanBakery v15 public folder and data folder:
    - `mkdir ~/bean_addons && mkdir ~/local_data && mkdir ~/local_data/log && mkdir ~/local_data/share && mkdir ~/local_data/config && chmod 777 ~/local_data/ -R`

7. Init BeanBakery v15 system for the first time
    - `python3 ./odoo-bin -c ./odoo.conf -d beanbakery -i base`
    - Exit to root user: `exit`
    
6. Running Bean Bakery ERP
    - `sudo cp /home/beanbakery/beanbakery_app/beanbakery.service /etc/systemd/system/`
    - *To start service:*
      - `sudo systemctl start beanbakery.service`
    - *To stop service:*
      - `sudo systemctl stop beanbakery.service`
    - *To check service status:*
      - `sudo systemctl status beanbakery.service`  

Now, the BeanBakery v15 is running on port 8069. You can test with command: `curl 127.0.0.1:8069`, if you get the following response that mean the BeanBakery v15 is running properly.
```
  ubuntu@ip-172-26-9-253:~$ curl 127.0.0.1:8069
      <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
      <title>Redirecting...</title>
      <h1>Redirecting...</h1>
      <p>You should be redirected automatically to target URL: <a href="/web">/web</a>
```
Next we have to setup the Nginx proxy.    
## Nginx setup
- **For Centos:**
  - dnf install nginx -y
- **For Ubuntu:**
  - sudo apt install nginx -y
- Turn off the nginx default setting: 
  - `sudo nano /etc/nginx/nginx.conf `
  - comment the line that have the following info "include /etc/nginx/sites-enabled/*" and save file
- **Create nginx default without SSL config file** by following command:
  - `sudo cp /home/beanbakery/beanbakery_app/nginx/conf/nginx_bean.conf /etc/nginx/conf.d/` 
- Or **Create nginx default with SSL config file**
  - `sudo cp /home/beanbakery/beanbakery_app/nginx/conf/nginx_bean_ssl.conf /etc/nginx/conf.d/`
  - Copy your SSL key to '/etc/ssl/nginx/' folder
  
- Test NGINX: `sudo nginx -t`
- If everything is OK, then reload nginx: `sudo nginx -s reload`

Now the Bean Bakery v15 system will run on port 80 / 443. 
Next step, just config the domain DNS to connect with VPS via IP address and done.

## Note
- If you want to change the DB password when install with **Docker**, edit the "odoo_pg_pass" file
- All the BeanBakery v15's custom module should put in the "beanbakery-addons" folder.
- The BeanBakery v15's config file is in the `~/local_data/config` folder ***(docker setup)*** and in the `~/beanbakery_app/` folder ***(non-docker setup)***
- All of the BeanBakery v15's running data are in the "~/local_data/share" folder ***(docker setup)***
- All of the BeanBakery v15's databasses data are in the "~/local_data/db" folder ***(docker setup)***
- All of the BeanBakery v15's logs are in the "~/local_data/log" folder 
- For production, need a security solution for "~/local_data" folder
- **For SSL key**, should buy SSL key from ssls.com (about $7 for 1 years and $16 for 5 years per domain, link: https://www.ssls.com/ssl-certificates/comodo-positivessl).
- **For email server**, should use Google Gsuite (about $6/month/account)
- **For VPS**, should a "2 core,4GB Ram, Ubuntu v20.04" VPS (about $20/month - ex: AWS lightsail)
- for more information about db filter:
  - https://trobz.com/blog/odoo-4/post/all-you-need-to-know-about-db-filtering-in-odoo-16
  - https://odoo-development.readthedocs.io/en/latest/admin/dbfilter.html
