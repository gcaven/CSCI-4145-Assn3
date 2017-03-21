##Install MongoDB##
##https://docs.mongodb.com/v3.0/tutorial/install-mongodb-on-ubuntu/##
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list
apt-get update
apt-get install -y mongodb-org
service mongod start

##IP Redirect##
iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 8081
apt-get install iptables-persistent

##Install Express App##
apt-get install nodejs
apt-get install npm
npm install -g forever
npm install
