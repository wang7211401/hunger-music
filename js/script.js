
var EventCenter = {
    on: function(type, handler){
      $(document).on(type, handler)
    },
    fire: function(type, data){
      $(document).trigger(type, data)
    }
}

var Footer = {
    init:function(){
        this.$footer = $('footer')
        this.$ul = this.$footer.find('ul')
        this.$box = this.$footer.find('.box')
        this.$leftBtn = this.$footer.find('.icon-left')
        this.$rightBtn = this.$footer.find('.icon-right')
        this.isToEnd = false
        this.isToStart = true
        this.isAnimate = false
        this.bind()
        this.render()
    },
    bind:function(){
        var _this =this
        this.$rightBtn.on('click',function(){
            if(_this.isAnimate) return
            var itemWidth = _this.$box.find('li').outerWidth(true)
            var rowCount = Math.floor(_this.$box.width()/itemWidth)
            if(!_this.isToEnd){
                _this.$ul.animate({
                    left:'-=' + rowCount * itemWidth
                },400,function(){
                    _this.isAnimate = false
                    _this.isToStart = false
                    if(parseFloat(_this.$box.width()) - parseFloat(_this.$ul.css('left')) >= parseFloat(_this.$ul.css('width'))){
                        _this.isToEnd = true
                    }
                })
            }
        })

        this.$leftBtn.on('click',function(){
            if(_this.isAnimate) return
            var itemWidth = _this.$box.find('li').outerWidth(true)
            var rowCount = Math.floor(_this.$box.width()/itemWidth)
            if(!_this.isToStart){
                _this.$ul.animate({
                    left:'+=' + rowCount * itemWidth
                },400,function(){
                    _this.isAnimate = false
                    _this.isToEnd = false
                    if(parseFloat(_this.$ul.css('left')) >= 0){
                        _this.isToStart = true
                    }
                })
            }
        })
        this.$footer.on('click','li',function(){
            $(this).addClass('active').siblings().removeClass('active')
            EventCenter.fire('select-albumn',{
                channelId: $(this).attr('data-channel-id'),
                channelName: $(this).attr('data-channel-name')
            }) 
        })
    },
    render:function(){
        var _this = this
        $.getJSON('//jirenguapi.applinzi.com/fm/getChannels.php',function(res){
            console.log(res.channels)
            _this.renderFooter(res.channels)
        })
        window.onresize =function(){
            _this.setStyle()
        }
    },
    renderFooter:function(data){
        data.unshift({
            channel_id: 0,
            name: '我的最爱',
            cover_small: 'http://cloud.hunger-valley.com/17-10-24/1906806.jpg-small',
            cover_middle: 'http://cloud.hunger-valley.com/17-10-24/1906806.jpg-middle',
            cover_big: 'http://cloud.hunger-valley.com/17-10-24/1906806.jpg-big',
          })
        var $li =''
        data.forEach(function(item){
            $li += `
                <li data-channel-id="${item.channel_id}" data-channel-name="${item.name}" class="">  
                    <div class="cover" style="background-image:url(${item.cover_middle})"></div>
                    <h3>${item.name}</h3>
                </li>
            `
        })
        this.$ul.html($li)
        this.setStyle()
        this.$ul.find('li').eq(1).click()
    },
    setStyle:function(){
        var rowCount = this.$ul.find('li').length
        var itemWidth = this.$ul.find('li').outerWidth(true)
        this.$ul.css({
            width: itemWidth * rowCount + 'px'
        })
    }

}

var app ={
    init:function(){
        this.$container = $('#page-music main')
        this.$bar = this.$container.find('.bar')
        this.audio = new Audio()
        this.audio.autoplay = true
        this.currentSong = null
        this.clock = null
        this.channelId = 'public_shiguang_80hou'
        this.channelName = '80后'
        this.collections = this.loadFromLocal()
        EventCenter.fire('select-albumn', {
            channelId: '0',
            channelName: '我的最爱'
        })
        this.bind()
    },
    bind:function(){
        var _this = this
        EventCenter.on('select-albumn', function(e, channel){
            console.log('select ', channel)
            _this.channelId = channel.channelId
            _this.channelName = channel.channelName
            _this.loadSong()
        })
        this.$container.find('.btn-play').on('click',function(){
            if($(this).hasClass('icon-pause')){
                $(this).removeClass('icon-pause').addClass('icon-play')
                _this.audio.pause()
            }else{
                $(this).removeClass('icon-play').addClass('icon-pause')
                _this.audio.play()
            }
        })
        this.$container.find('.btn-next.icon-next').on('click',function(){
            _this.loadSong()
        })
        this.audio.addEventListener('play',function(){
            console.log('play')
            clearInterval(_this.clock)
            _this.clock = setInterval(function(){
                _this.updateState()
                _this.setLyric()
            },1000)
        })
        this.audio.addEventListener('pause',function(){
            console.log('pause')
            clearInterval(_this.clock)
        })
        this.audio.addEventListener('end',function(){
            console.log('end')
            _this.loadSong()
        })
        this.$container.find('.btn-collect').on('click', function(){
            var $btn = $(this)
            if($btn.hasClass('active')){
              $btn.removeClass('active')
              delete _this.collections[_this.currentSong.sid]
            }else{
              $(this).addClass('active')
              _this.collections[_this.currentSong.sid] = _this.currentSong
              console.log(_this.collections)
            }
            _this.saveToLocal()
        })
        this.$bar.on('click',function(e) {
            var percent = e.offsetX / parseInt(getComputedStyle(this).width)
            _this.audio.currentTime = percent * _this.audio.duration
            _this.$bar.find('.bar-progress').css({
                'width':percent * 100 + "%"
            })
            _this.setLyric()
        })

    },
    loadSong:function(){
        var _this = this
        if(this.channelId === '0'){
            _this.loadCollection()
        }else{
            $.getJSON('//jirenguapi.applinzi.com/fm/getSong.php',{channel: _this.channelId},function(res){
                _this.play(res.song[0] || null)
            })
        }
        
    },
    play:function(song){
        this.currentSong = song
        this.audio.src = song.url
        this.$container.find('.btn-play').removeClass('icon-play').addClass('icon-pause')
        this.$container.find('.detail h1').text(song.title)
        this.$container.find('figure').css({
            'background-image': 'url('+ song.picture +')'
        })
        this.$container.find('.author').text(song.artist)
        $('.bg').css({
            'background-image': 'url('+ song.picture +')'
        })
        this.$container.find('.tag').text(this.channelName)
        if(this.collections[song.sid]){
            this.$container.find('.btn-collect').addClass('active')
        }else{
            this.$container.find('.btn-collect').removeClass('active')
        }
        this.loadLyric(song.sid)

    },
    updateState:function(){
        var secondStr = Math.floor(this.audio.currentTime - Math.floor(this.audio.currentTime/60)*60) >= 10 ? Math.floor(this.audio.currentTime - Math.floor(this.audio.currentTime/60)*60) : '0' + Math.floor(this.audio.currentTime - Math.floor(this.audio.currentTime/60)*60)
        var timeStr = Math.floor(this.audio.currentTime/60) + ':' + secondStr
        this.$container.find('.current-time').text(timeStr)
        this.$container.find('.bar-progress').css('width',this.audio.currentTime/this.audio.duration *100 + '%')
    },
    loadLyric:function(sid){
        var _this =this
        $.getJSON('//jirenguapi.applinzi.com/fm/getLyric.php', {sid: sid},function(res){
            console.log('song',res)
            var lyricObj = {}
            res.lyric.split('\n').forEach(function(item){
                var timeArr = item.match(/\d{2}:\d{2}/g)
                if(timeArr){
                    timeArr.forEach(function(time){
                        lyricObj[time] = item.replace(/\[.+\]/g,"")
                    })
                }
            })
            console.log('lyricObj',lyricObj)
            _this.lyricObj = lyricObj
        })
    },
    setLyric:function(){
        var secondStr = Math.floor(this.audio.currentTime - Math.floor(this.audio.currentTime/60)*60) >= 10 ? Math.floor(this.audio.currentTime - Math.floor(this.audio.currentTime/60)*60) : '0' + Math.floor(this.audio.currentTime - Math.floor(this.audio.currentTime/60)*60)
        var timeStr = (Math.floor(this.audio.currentTime/60) >= 10 ? Math.floor(this.audio.currentTime/60) : '0' + Math.floor(this.audio.currentTime/60)) + ':' + secondStr
        if(this.lyricObj && this.lyricObj[timeStr]){
            this.$container.find('.lyric p').text(this.lyricObj[timeStr]).boomText()
        }
    },
    loadFromLocal: function(){
        return JSON.parse(localStorage['collections']||'{}')
    },

    saveToLocal: function(){     
        localStorage['collections'] = JSON.stringify(this.collections)
        console.log(localStorage)
    },

    loadCollection: function(){
        var keyArray = Object.keys(this.collections)
        if(keyArray.length === 0) return
        var randomIndex = Math.floor(Math.random()* keyArray.length)
        var randomSid = keyArray[randomIndex]
        this.play(this.collections[randomSid])
    }
}
$.fn.boomText = function(type){
    type = type || 'rollIn'
    this.html(function(){
      var arr = $(this).text()
      .split('').map(function(word){
          return '<span class="boomText">'+ word + '</span>'
      })
      return arr.join('')
    })
    
    var index = 0
    var $boomTexts = $(this).find('span')
    var clock = setInterval(function(){
      $boomTexts.eq(index).addClass('animated ' + type)
      index++
      if(index >= $boomTexts.length){
        clearInterval(clock)
      }
    }, 100)
  }

Footer.init()
app.init()