// 今日新闻卡片逻辑 - 移除标题外框，仅保留列表
(function() {
    // 配置项
    const API_URL = 'https://tools.mgtv100.com/external/v1/toutiao/index';
    const CACHE_DURATION = 10 * 60 * 1000; // 10分钟缓存
    const CACHE_KEY = 'news_list_cache';   // 缓存键名

    // 核心渲染函数（移除标题外框）
    function news() {
        let html = '<div id="newsContent">'; // 完全去掉标题外框，直接渲染列表
        let data = JSON.parse(localStorage.getItem(CACHE_KEY));
        let nowTime = Date.now();
        let ls;

        // 缓存逻辑
        if (data == null || nowTime - data.timestamp > CACHE_DURATION) {
            getData();
            return;
        } else {
            ls = data.data;
        }

        // 空数据处理
        if (!ls || ls.length === 0) {
            html += '<div class="empty-tip">暂无新闻数据~</div>';
        } else {
            // 直接渲染列表，无任何外框/标题
            for (let i = 0; i < ls.length; i++) {
                let item = ls[i];
                let rankClass = i < 3 ? ` news-rank-top${i+1}` : '';
                html += '<li class="news-item">';
                html += `<div class="news-rank${rankClass}">${i+1}</div>`;
                html += `<span class="news-title"><a title="${item.title || '无标题'}" href="${item.url || '#'}" target="_blank" rel="external nofollow noreferrer">${item.title || '无标题'}</a></span>`;
                // html += `<div class="news-meta">${item.date || '未知时间'}</div>`;
                html += '</li>';
            }
            html += '</div>';
        }
        
        // 直接渲染到核心容器，无任何外层包裹
        document.getElementById('newsContent').innerHTML = html;
    }

    // 获取数据并缓存
    function getData() {
        fetch(API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) throw new Error(`状态码: ${response.status}`);
            return response.json();
        })
        .then(data => {
            const hotList = data?.data?.result?.data || [];
            const cacheData = {
                timestamp: Date.now(),
                data: hotList
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
            news(); // 重新渲染
        })
        .catch(error => {
            console.error('获取新闻数据失败:', error);
            document.getElementById('newsContent').innerHTML = '<div class="empty-tip">暂无新闻数据~</div>';
        });
    }

    // 页面加载后执行
    try {
        if (document.getElementById('news').clientWidth) news();
    } catch (error) {
        news(); // 容错，直接执行
    }
})();