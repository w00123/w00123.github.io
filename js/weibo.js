// 如果你开启了在手机端显示侧边栏，可以将下面这行代码注释，开启下面的weibo();
try { if (document.getElementById('weibo').clientWidth) weibo(); } catch (error) {}
// weibo();

function weibo() {
    let hotness = {
        '1': 'weibo-boom',
        '2': 'weibo-hot',
        '3': 'weibo-boil',
        '4': 'weibo-new',
        '5': 'weibo-recommend',
        '6': 'weibo-jyzy',
        '7': 'weibo-jyzy',
        '8': 'weibo-jyzy'
    }
    let html = '<div id="weibo-container">'
    let data = JSON.parse(localStorage.getItem('weibo'));
    let nowTime = Date.now();
    let ls;
    if (data == null || nowTime - data.time > 600000) { // 600000为缓存时间，即10分钟，避免频繁请求，加快本地访问速度。
        getData();
        return
    } else {
        ls = JSON.parse(data.ls)
    };
    for (let item of ls) {
        html += '<div class="weibo-list-item"><div class="weibo-hotness ' + hotness[item.index] + '">' + item.index + '</div>' +
            '<span class="weibo-title"><a title="' + item.title + '" href="' + item.url + '" target="_blank" rel="external nofollow noreferrer">' + item.title + '</a></span>' +
            '<div class="weibo-num"><span>' + item.hot + '</span></div></div>'
    }
    html += '</div>';
    document.getElementById('weiboContent').innerHTML = html;
}

function getData() {
    // 这里采用新的api，如果炸了，可以换其他的，但注意api接收的json样式
    fetch('https://v2.api-m.com/api/weibohot').then(data => data.json()).then(data => {
        if (data.code === 200) {
            data = { time: Date.now(), ls: JSON.stringify(data.data) }
            localStorage.setItem('weibo', JSON.stringify(data))
        } else {
            console.error('获取数据失败');
        }
    }).then(weibo);
}

if (document.querySelector('#bber-talk')) {
    var swiper = new swiper('.swiper-container', {
      direction: 'vertical', 
      loop: true,
      autoplay: {
      delay: 3000,
      pauseOnMouseEnter: true
    },
    });
  }
