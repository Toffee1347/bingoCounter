const socket = io()
let emits
let server_token

function load_token(socket) {
    if (sessionStorage.getItem('token')) {
        socket.emit('reconnect_user', {token:sessionStorage.getItem('token')})
    }
    else {
        let step = 0
        let token = ''
        while (step <= 50) {
            token += btoa(Math.floor(Math.random() * 1000000000000000000000))
            step++
        }
        socket.emit('add_user', {token:token})
        sessionStorage.setItem('token', token)
    }
    return sessionStorage.getItem('token')
}

function set_emit_on(socket, token) {
    return {
        'emit' : (event, data) => {
            return socket.emit(token + event, {token:server_token, body:data})
            
        },
        'on' : (event, func) => {
            return socket.on(token + event, (data) => {
                func(data.body, data.token)
            })
        }
    }
}

$(document).ready(() => {
  server_token = load_token(socket)
  emits = set_emit_on(socket, server_token)
  $('body').css('animationPlayState', 'running')
  $('button').click(() => {
    $('body').css('opacity', '0')
    $('body').addClass('leaving')
  })
  emits.on('error', (body, token) => {
    window.location.href = `/error#${btoa(JSON.stringify(body))}`
  })
  if (typeof(onload) == 'function') {
      onload()
  }
})

function copy(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text
    document.body.appendChild(textArea);
    textArea.focus()
    textArea.select()
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }