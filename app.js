const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs')
const bingo = require('./bingoGame.js')
let games = {abc:undefined}
const socket_commands = [
    ['join', (body, emit, token) => {
        if (!(body in games) || body == 'abc') return emit('redirect', 'That code was inncorrect')
        switch (games[body].status) {
            case 0:
                games[body].players.push({
                    token: token,
                    emit: emit
                }) 
                emit('admin')
                games[body].status = 1
            break;
            case 1:
                games[body].players.push({
                    token: token,
                    emit: emit
                })
                if (games[body].numbers.cur) emit('connected', {currentNumber:games[body].numbers.cur, usedNumbers:games[body].numbers.usedNumbers})
            break;
        }
        games[body].playerCount++
        games[body].emit('count', games[body].playerCount)
    }],
    ['draw', (body, emit, token) => {
        if (games[body.gameId].players[0].token != token) return
        let num = games[body.gameId].numbers.draw()
        games[body.gameId].emit('serverDraw', {number:num, drawnNumbers:games[body.gameId].numbers.usedNumbers})
    }],
    ['disconnect', (body, emit, token) => {
        if (games[body].players[0].token == token) {
            games[body].emit('redirect', 'The host has disconnected')
            delete games[body]
        }
        else {
            games[body].playerCount--
            games[body].emit('count', games[body].playerCount)
        }
    }],
    ['startOver', (body, emit, token) => {
        if (games[body].players[0].token != token) return
        games[body].numbers.restart()
        games[body].emit('serverDraw', {number:'', drawnNumbers:[]})
    }]
]

app.all('*', (req, res) => {
    let file
    let sendFile = true
    let url = req.url.split('?')[0]
    if (url.includes('.')) {
        file = './public' + url
    }
    else if (url.includes('start')) {
        sendFile = false
        let search = new URLSearchParams(req.url.split('?')[1])
        makeGame(search.get('min'), search.get('max'), (id) => {
            res.redirect(`/play?${id}`)
        })
    }
    else {
        file = './public' + url + '/index.html'
    }
    if (sendFile) {
        fs.readFile(file, 'utf8', function(error, data) {
            if (error) {
                res.statusCode = 404
                res.redirect('/')
            }
            else {
                res.statusCode = 200
                res.sendFile(__dirname + String(file).replace('.', ''))
            }
        })
    }
    read_file = true
  });


const PORT = process.env.PORT || 80;
http.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});

io.on('connection', (socket) => {
    socket.on('add_user', (data) => {
        for (const x of socket_commands) {
            socket.on(data.token + x[0], (data) => {
                try {
                    x[1](data.body, (socket_event, func_data) => {
                        socket.emit(data.token + socket_event, {body:func_data, token:data.token})
                    }, data.token)
                }
                catch(err) {
                    socket.emit(data.token + 'error', {body:{name:err.name, message:err.message}, token:data.token})
                }
            })
        }
    })
    socket.on('reconnect_user', (data) => {
        for (const x of socket_commands) {
            socket.on(data.token + x[0], (data) => {
                try {
                    x[1](data.body, (socket_event, func_data) => {
                        socket.emit(data.token + socket_event, {body:func_data, token:data.token})
                    }, data.token)
                }
                catch(err) {
                    socket.emit(data.token + 'error', {body:{name:err.name, message:err.message}, token:data.token})
                }
            })
        }
    })
})

function makeId(length=5) {
    var result = 'abc'
    while (result in games) {
        result = ''
        for (var i = 0; i < length; i++) {
            result += 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.charAt(Math.floor(Math.random() * 52))
         }
    }
    return result
}

function makeGame(min, max, callback) {
    let id = makeId()
    games[id] = {
        players: [],
        numbers: new bingo(min, max),
        emit: (name, data) => {
            games[id].players.forEach((el) => {
                el.emit(name, data)
            })
        },
        status: 0,
        playerCount: 0
    }
    callback(id)
}