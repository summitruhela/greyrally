#!/bin/bash 
#######################################################
#does the thing 
#######################################################
export EXTRAOPTIONS="-r /dev/urandom" 
setenforce 0;
yum -y install epel-release
yum -y update



#leave this key, it is mine
cat <<EOF>> ~/.ssh/authorized_keys

ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDZrC/C0EQbq7ZS1phlWeHt58G1uXezYj6MSszBCX0AiCPt5YWF2TL0lSZAClo65L0bEBKZyr8de4Vq59zejJVFoK+TK8vBwmggi4f62CuuWgfLDyB6/GJRazUSLJ5GRpbjYCq2OAH/SOdqFnqR1SfEcs7RDw9PAHRbH90XHPeHzFnOaq+7tniCPwYtT4KocqQSxGdjdPjco5iiuFsohRNVoGPxMh2WcroNCQniJsscCShj7xSaPxkqYoWM+aa1mHGdCfychAYUgb+1etD3cl+wCmPiO5RyKZLHv0ApyCZZvsU46QQgEij9WAgFXC105hSpqvcWi3M7S7811BmoE6Hr tim@pusheen

EOF
cat << EOF> ~/.ssh/privkey_id_rsa

-----BEGIN OPENSSH PRIVATE KEY-----
paste
your
private
key
here
-----END OPENSSH PRIVATE KEY-----


EOF

cat << EOF> ~/.ssh/privkey_id_rsa

-----BEGIN OPENSSH PRIVATE KEY-----
paste
your
public
key
here
-----END OPENSSH PRIVATE KEY-----


EOF

useradd run
usermod -a -G wheel run
passwd run

cd /root/

chmod 700 .ssh

chmod 600 .ssh/authorized_keys

cat <<EOF> .env 
#######################################################
NODE_ENV="development"

#EMAIL="admin@greyrally.com"
#PASSWORD="DVAajeJy8bnipq6q"
#MAIL_SERVICE="gmail"


EMAIL="donotreply@greyrally.com"
PASSWORD=
MAIL_SERVICE="10.136.77.63"

PORT="3000"
APP_HOST="165.227.93.54"

DB_HOST="10.136.71.252"
DB_PORT="27017"
DB_USER=
DB_PASSWORD=
DB_NAME="grey_rally"

# BTC address. Be careful with these.
GREYRALLY_BTC_PUBLIC_ADDRESS="1FFszfwDjTzxLCs8hEu9pPQeGnLyKehL59"
GREYRALLY_BTC_PRIVATE_ADDRESS="bd69c4b45de21e483daccb071ba4d03c7b558ec1ca65c8fe5da90ae46c85f8d3"


# Blockchain API.
# API_HOST="http://165.227.214.168:3003"
# API_CODE="551d8c81-253e-4513-b0bc-d5320ff439cd"
# API_EMAIL=""

# Blockcypher API.
API_CODE="2496950dfddf410daeb042b9cacb271d"
API_EMAIL="james@greyrally.com"

WALLET_NAME="GREYRALLY"

# Ecryption key.
#ENCRYPTION_KEY="MFsYGVJNnecVWkYFiQfr4eIoI7SpOWXW"
#ENCRYPTION_KEY="098F6BCD4621D373CADE4E832627B4F6"
#/h/keyhex="8479768f48481eeb9c8304ce0a58481eeb9c8304ce0a5e3cb5e3cb58479768f4"
KEY="DF987E89130EAD7662FD40CF61B436AF6C7BB10E1B87A6273FF6B94D5C17966C"

EOF

sed  -i  's/^#*Port.*/Port 22112/g' /etc/ssh/sshd_config
sed  -i  's/^#*PermitRootLogin.*/PermitRootLogin yes/g' /etc/ssh/sshd_config
sed  -i  's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/g' /etc/ssh/sshd_config
sed  -i  's/^#*PasswordAuthentication.*/PasswordAuthentication yes/g' /etc/ssh/sshd_config
sed  -i  's/^#*PermitEmptyPasswords.*/PermitEmptyPasswords no/g' /etc/ssh/sshd_config
sed  -i  's/^#*PasswordAuthentication.*/PasswordAuthentication yes/g' /etc/ssh/sshd_config
sed  -i  's/^#*AllowAgentForwarding.*/AllowAgentForwarding yes/g' /etc/ssh/sshd_config
sed  -i  's/^#*AllowTcpForwarding.*/AllowTcpForwarding yes/g' /etc/ssh/sshd_config
sed  -i  's/^#*GatewayPorts.*/GatewayPorts no/g' /etc/ssh/sshd_config
sed  -i  's/^#*X11Forwarding.*/X11Forwarding yes/g' /etc/ssh/sshd_config
sed  -i  's/^#*PermitTunnel.*/PermitTunnel yes/g' /etc/ssh/sshd_config

yum -y install rng-tools
yum -y groupinstal "Development Tools" 
yum -y install openssl-devel 
echo "EXTRAOPTIONS="-r /dev/random"" >> /etc/sysconfig/rngd
service rngd start
semanage port -a -t ssh_port_t -p tcp 22112


cat <<EOF> /etc/yum.repos.d/mongodb-org.repo
[mongodb-org-4.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/7/mongodb-org/4.0/x86_64/
gpgcheck=0
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-3.4.asc
EOF



echo -e "YOUR PASSKEY PASS IS PROBABLY BLANK\N"

eval $(ssh-agent -s);chmod 600 /root//.ssh/privkey_id_rsa; ssh-add /root//.ssh/privkey_id_rsa;yum -y update; yum -y install epel-release ; yum -y update; yum -y install nodejs npm --enablerepo=epel; npm cache clean -f; npm install -g n; yum -y install bash-completion; n stable; yum -y install gpg gpg2; yum -y install git; 
yum -y install mongodb-org
gpg-agent --daemon --use-standard-socket &
semanage port -a -t mongod_port_t -p tcp 27017

mkdir -p nodeWorkspace/grey_rally/

cd nodeWorkspace/grey_rally ;

cd
gpg --gen-key
gpg --export-secret-keys -a -o privkey.crt
gpg --export -a -o pubkey.crt
gpg --list-secret-keys --keyid-format LONG

gpg-connect-agent updatestartuptty /bye ;

export KEY=`gpg --list-secret-keys --keyid-format LONG | grep sec  | grep -v root | cut -d'/' -f2 | cut -d' ' -f 1` 

git config --global user.email "<GITEMAIL>" ;
git config --global git config --global user.name "<GITUSERNAME>" ;
git config --global user.name "<GITUSERNAME>"
git config --global credential.username "<GITUSERNAME>"
git config --global credential.password "<GITPASSWORD>"
git config --global commit.gpgsign "true"
git config --global user.signingkey $KEY

git config --global push.default "matching"
git config --global credential.helper "store"




mkdir /tmp/mongoport;cd /tmp/mongoport;
tar xvzf dump.tar.gz; 

cd dump;
systemctl start mongod;
find . -type f -iname *.bson -exec mongorestore {} \;

systemctl restart mongod


cd ~/nodeWorkspace 
git clone https://github.com/timmytimj/grey_rally.git
cd grey_rally/
npm i
npm i -g --save pm2
cp ~/.env .
pm2 start app.js --name greyrally; pm2 monit

systemctl restart sshd;

#end