/* Helper functions */

var getDOM = function (query) {
  return document.querySelectorAll (query)
}

var puts = function (message) {
  console.info (message)
}

/* Main */
window.onload = function () {
  window.app = {
    settings: {
      step:  1.0,
      tempo: 0.05
    },
    state: {
      _timer:  null,
      blur:    true,
      playing: null,
      AB:      []
    },
    code: {
      "9":  "mode",
      "27": "normal_mode",
      "73": "insert_mode",
      "65": "insert_mode",
      "80": "play_pause",
      "72": "backward",
      "37": "backward",
      "75": "uptempo",
      "38": "uptempo",
      "74": "downtempo",
      "40": "downtempo",
      "76": "forward",
      "39": "forward",
      "89": "repeat",
      "68": "open_hard_drive",
      "85": "open_url",
      "82": "loop",
    }
  }

  /* CSS effects */
  var ABrepeatCSS = function () {
    var ab = app.state.AB.length
    var btn = getDOM ("#btn_repeat") [0]
    var s_a = getDOM ("#btn_repeat_a") [0]
    var s_b = getDOM ("#btn_repeat_b") [0]

    if (app.state.playing) {
      puts (ab)
      switch (ab) {
        case 0:
          btn.style.backgroundColor = "Crimson"
          s_a.style.fontWeight = "bold"
          s_a.style.textDecoration = "underline"
          break
        case 1:
          btn.style.backgroundColor = "RoyalBlue"
          s_b.style.fontWeight = "bold"
          s_b.style.textDecoration = "underline"
          break
        case 2:
          btn.style.backgroundColor = "Black"
          s_a.style.fontWeight = "normal"
          s_a.style.textDecoration = "none"
          s_b.style.fontWeight = "normal"
          s_b.style.textDecoration = "none"
          break
        default:
          break
      }
    }
  }
  getDOM ("#btn_repeat") [0]
  .addEventListener ('click', ABrepeatCSS)

  var openFileFromHardDrive =  function (event) {
    getDOM ("#input")[0]
    .click()

    getDOM ("#btn_open")[0]
    .blur ()
  }

  var readFileFromHardDrive = function (event) {
    readFileAsArrayBuffer (event.target.files[0])
  }

  var playAndPauseCSS = function () {
    if (app.state.playing) {
      getDOM ("#i_play") [0].style.opacity = 1
      getDOM ("#i_pause") [0].style.opacity = 0
    }
    else {
      getDOM ("#i_play") [0].style.opacity = 0
      getDOM ("#i_pause") [0].style.opacity = 1
    }
  }

  var loop_css = function () {
    var audio = getDOM ("#dummy_audio") [0]
    var btn_loop = getDOM ("#btn_loop") [0]

    if (audio.loop) {
      btn_loop.style.opacity = 0.6
    }
    else {
      btn_loop.style.opacity = 1.0
    }
  }

  getDOM ("#btn_open") [0]
  .addEventListener ('click', openFileFromHardDrive)

  getDOM ("#input") [0]
  .addEventListener ('change', readFileFromHardDrive)

  getDOM ("#btn_play_pause") [0]
  .addEventListener ('click', playAndPauseCSS)

  getDOM ("#btn_loop") [0]
  .addEventListener ('click', loop_css)

  getDOM ("#textarea")[0]
  .addEventListener ('blur', function () {
    app.state.blur = true
  })

  getDOM ("#textarea")[0]
  .addEventListener ('focus', function () {
    app.state.blur = null
  })

///////////////////////////////////////////////

  var ABrepeat = function (opt_duration) {
    var audio = getDOM ("#dummy_audio")[0]
    var A = app.state.AB [0]
    var B = app.state.AB [1]
    var duration = opt_duration ? opt_duration: Math.floor ((B - A) * 1000)

    app.state._timer = setTimeout (function () {
      audio.currentTime = A
      clearTimeout (app.state._timer)
      if (audio.loop) {
        ABrepeat ()
      } else {
        playAndPauseCSS ()
        app.state.playing = null
        audio.pause()
      }
    }, duration)
  }

  var readFileAsArrayBuffer = function (file) {
    return new Promise (function(resolve, reject) {
      try {
        reader = new FileReader ()
        reader.readAsBinaryString (file)
        reader.onload = function (event) {
          var player = getDOM ("#dummy_audio")[0]
          var data = btoa (event.target.result)
          player.src = "data:video/webm;base64," + data
          player.addEventListener ('ended', function () {
            app.state.playing = null
          })
          resolve ("done")
        }
      } catch (error) {
        reject (error)
      }
    })
  }

///////////////////////////////////////////////

  var keyDownStream = Rx.Observable.fromEvent (
    getDOM ("body")[0],
    'keydown'
  )
  .map (function (event) {
    return app.code[event.keyCode]
  })

  var getBtnStream = function (button_name) {
    return Rx.Observable.fromEvent (
      getDOM ("#btn_" + button_name),
      'click'
    )
    .map (function (event) {
      return button_name
    })
  }

  var source = Rx.Observable.merge (
    keyDownStream,
    getBtnStream ("play_pause"),
    getBtnStream ("loop"),
    getBtnStream ("repeat"),
    getBtnStream ("forward"),
    getBtnStream ("backward"),
    getBtnStream ("uptempo"),
    getBtnStream ("downtempo")
  )
  .subscribe (function (label) {
    var audio = getDOM ("#dummy_audio")[0]
    if (app.state.blur) {
      switch (label) {
        case 'play_pause':
          var AB = app.state.AB.length
          if (app.state.playing) {
            audio.pause ()
            app.state.playing = null
            if (AB === 2) {
              clearTimeout (app.state._timer)
            }
          } else {
            audio.play ()
            app.state.playing = true
            if (AB === 2) {
              var d = Math.floor ((app.state.AB [1] - audio.currentTime) * 1000)
              ABrepeat (d)
            }
          }
          break

        case 'play':
          audio.play ()
          app.state.playing = true
          break

        case 'pause':
          audio.pause ()
          break

        case 'stop':
          audio.pause()
          break

        case 'forward':
          var time = audio.currentTime + app.settings.step
          var B = app.state.AB [1]

          if (B && time < B) {
            audio.currentTime = time
            clearTimeout (app.state._timer)
            var d = Math.floor ((app.state.AB [1] - audio.currentTime) * 1000)
            ABrepeat (d)
            break
          }
          if (time < audio.duration) {
            audio.currentTime = time
            break
          }
          break

        case 'backward':
          var time = audio.currentTime - app.settings.step
          var A = app.state.AB [0]

          if (A && time > A) {
            audio.currentTime = time
            clearTimeout (app.state._timer)
            var d = Math.floor ((app.state.AB [1] - audio.currentTime) * 1000)
            ABrepeat (d)
            break
          }
          if (time < 0) {
            audio.currentTime = 0
            break
          }
          break


          audio.currentTime -= app.settings.step
          break

        case 'uptempo':
          var tempo = audio.playbackRate + app.settings.tempo
          var b = app.state.AB [1]
          app.state.step
          if (b) {
            a
          }
          audio.playbackRate = (tempo > 4.0)? 4.0: tempo
          break

        case 'downtempo':
          var tempo = audio.playbackRate - app.settings.tempo
          audio.playbackRate = (tempo < 0.5)? 0.5: tempo
          break

        case 'insert_mode':
          app.state.blur = null
          setTimeout (function () {
            getDOM ("#textarea")[0].focus()
          })
          break

        case 'normal_mode':
          app.state.blur = true
          getDOM ("#textarea")[0].blur ()
          break

        case 'repeat':
          app.state.AB.push (audio.currentTime)
          var len = app.state.AB.length

          if (len > 2) {
            clearTimeout (app.state._timer)
            app.state.AB = []
          }
          if (len === 2) {
            audio.currentTime = app.state.AB [0]
            ABrepeat ()
          }
          break

        case 'loop':
          if (audio.loop) {
            audio.loop = false
          }
          else {
            audio.loop = true
          }
          break

        default:
          break
      }
    }
  })
}
