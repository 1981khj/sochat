var Chat = module.exports = {
    users: [],
    rooms: [],
    id:[],    
    hasUser: function(nickname) {
        var users = this.users.filter(function(element) {
            return (element === nickname);   
        });

        if (users.length > 0) {
            return true;
        } else {
            return false; 
        }
    },
    addUser: function(nickname) {
        this.users.push(nickname);
    },
    removeUser: function(nickname){        
        this.users.splice(this.users.indexOf(nickname), 1);
    },    
    getUserList: function(){
        return this.users;
    },
    addId: function(id) {
        this.id.push(id);
    },
    removeId: function(id){        
        this.id.splice(this.id.indexOf(id), 1);
    },
    getIdFromName: function(nickname){
        console.log(this.users);
        console.log(nickname);
        console.log(this.users.indexOf(nickname));
        return this.id[this.users.indexOf(nickname)];
    },
    getIdList: function(){
        return this.id;
    },
    hasRoom: function(roomName) {
        var rooms = this.rooms.filter(function(element) {
            return (element.name === roomName);   
        });

        if (rooms.length > 0) {
            return true;
        } else {
            return false; 
        }
    },
    addRoom: function(roomName) {
        this.rooms.push({name:roomName, attendants:[]});
    },
    getRoomList: function(){
        return this.rooms.map(function(element){
            console.log(element);
            return element.name;
        });
    },
    joinRoom: function(roomName, user) {
        var rooms = this.rooms.filter(function(element) {
            return (element.name === roomName);   
        });
        if (!this.hasAttendant(rooms[0].attendants, user)) {
            rooms[0].attendants.push(user);
        }
    },
    hasAttendant: function(attendants, user) {
        return attendants.some(function(element) { 
            return (element === user);
        });
    },
    getAttendantsList: function(roomName) {
        var rooms = this.rooms.filter(function(element) {
            return (element.name === roomName);
        });
        return rooms[0].attendants;
    },
    leaveRoom: function(roomName, user) {
        var rooms = this.rooms.filter(function(element) {
            return (element.name === roomName);   
        });
        
        rooms[0].attendants.forEach(function(element, index, arr) {
            if (element === user) {
                arr.splice(index, 1);
            }
        });
    },
    makeRandomName: function(length) {
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');
        
        if (! length) {
            length = Math.floor(Math.random() * chars.length);
        }
        
        var str = '';
        for (var i = 0; i < length; i++) {
            str += chars[Math.floor(Math.random() * chars.length)];
        }
        return str;
    }
};