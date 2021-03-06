window.live2d_settings = Array();

live2d_settings['waifuDraggableRevert'] = true; // 松开鼠标还原拖拽位置，可选 true(真), false(假)

String.prototype.render = function(context) {
  var tokenReg = /(\\)?\{([^\{\}\\]+)(\\)?\}/g;

  return this.replace(tokenReg, function(word, slash1, token, slash2) {
    if (slash1 || slash2) {
      return word.replace('\\', '');
    }

    var variables = token.replace(/\s/g, '').split('.');
    var currentObject = context;
    var i, length, variable;

    for (i = 0, length = variables.length; i < length; ++i) {
      variable = variables[i];
      currentObject = currentObject[variable];
      if (currentObject === undefined || currentObject === null) return '';
    }
    return currentObject;
  });
};

var re = /x/;
console.log(re);

function empty(obj) {
  return typeof obj == 'undefined' || obj == null || obj == '' ? true : false;
}
function getRandText(text) {
  return Array.isArray(text)
    ? text[Math.floor(Math.random() * text.length + 1) - 1]
    : text;
}
  
function showMessage(text, timeout, flag) {
  if (
    flag ||
    sessionStorage.getItem('waifu-text') === '' ||
    sessionStorage.getItem('waifu-text') === null
  ) {
    if (Array.isArray(text))
      text = text[Math.floor(Math.random() * text.length + 1) - 1];
    if (live2d_settings.showF12Message)
      console.log('[Message]', text.replace(/<[^<>]+>/g, ''));

    if (flag) sessionStorage.setItem('waifu-text', text);

    $('.waifu-tips').stop();
    $('.waifu-tips')
      .html(text)
      .fadeTo(200, 1);
    if (timeout === undefined) timeout = 5000;
    hideMessage(timeout);
  }
}

function hideMessage(timeout) {
  $('.waifu-tips')
    .stop()
    .css('opacity', 1);
  if (timeout === undefined) timeout = 5000;
  window.setTimeout(function() {
    sessionStorage.removeItem('waifu-text');
  }, timeout);
  $('.waifu-tips')
    .delay(timeout)
    .fadeTo(200, 0);
}

function initModel(waifuPath, type) {
  /* 加载看板娘样式 */
  live2d_settings.waifuSize = live2d_settings.waifuSize.split('x');
  live2d_settings.waifuTipsSize = live2d_settings.waifuTipsSize.split('x');
  live2d_settings.waifuEdgeSide = live2d_settings.waifuEdgeSide.split(':');

 

  if (live2d_settings.waifuEdgeSide[0] == 'left')
    $('.waifu').css('left', live2d_settings.waifuEdgeSide[1] + 'px');
  else if (live2d_settings.waifuEdgeSide[0] == 'right')
    $('.waifu').css('right', live2d_settings.waifuEdgeSide[1] + 'px');

  window.waifuResize = function() {
    $(window).width() <= Number(live2d_settings.waifuMinWidth.replace('px', ''))
      ? $('.waifu').hide()
      : $('.waifu').show();
  };
  if (live2d_settings.waifuMinWidth != 'disable') {
    waifuResize();
    $(window).resize(function() {
      waifuResize();
    });
  }

  try {
    if (live2d_settings.waifuDraggable == 'axis-x')
      $('.waifu').draggable({
        axis: 'x',
        revert: live2d_settings.waifuDraggableRevert
      });
    else if (live2d_settings.waifuDraggable == 'unlimited')
      $('.waifu').draggable({ revert: live2d_settings.waifuDraggableRevert });
    else $('.waifu').css('transition', 'all .3s ease-in-out');
  } catch (err) {
    console.log('[Error] JQuery UI is not defined.');
  }

  live2d_settings.homePageUrl == 'auto'
    ? window.location.protocol + '//' + window.location.hostname + '/'
    : live2d_settings.homePageUrl;
  if (
    window.location.protocol == 'file:' &&
    live2d_settings.modelAPI.substr(0, 2) == '//'
  )
    live2d_settings.modelAPI = 'http:' + live2d_settings.modelAPI;

  if (typeof waifuPath == 'object') loadTipsMessage(waifuPath);
  else {
    $.ajax({
      cache: true,
      url:
        waifuPath == ''
          ? live2d_settings.tipsMessage
          : waifuPath.substr(waifuPath.length - 15) == 'waifu-tips.json'
          ? waifuPath
          : waifuPath + 'waifu-tips.json',
      dataType: 'json',
      success: function(result) {
        loadTipsMessage(result);
      }
    });
  }

  if (waifuPath === undefined) waifuPath = '';
  var modelId = localStorage.getItem('modelId');
  var modelTexturesId = localStorage.getItem('modelTexturesId');

  if (!live2d_settings.modelStorage || modelId == null) {
    var modelId = live2d_settings.modelId;
    var modelTexturesId = live2d_settings.modelTexturesId;
  }
  loadModel(modelId, modelTexturesId);
}

function loadModel(modelId, modelTexturesId = 0) {
  if (live2d_settings.modelStorage) {
    localStorage.setItem('modelId', modelId);
    localStorage.setItem('modelTexturesId', modelTexturesId);
  } else {
    sessionStorage.setItem('modelId', modelId);
    sessionStorage.setItem('modelTexturesId', modelTexturesId);
  }
  loadlive2d(
    'live2d',
    live2d_settings.modelAPI + 'get/?id=' + modelId + '-' + modelTexturesId,
    live2d_settings.showF12Status
      ? console.log(
          '[Status]',
          'live2d',
          '模型',
          modelId + '-' + modelTexturesId,
          '加载完成'
        )
      : null
  );
}

function loadTipsMessage(result) {
  window.waifu_tips = result;

  $.each(result.mouseover, function(index, tips) {
    $(document).on('mouseover', tips.selector, function() {
      var text = getRandText(tips.text);
      text = text.render({ text: $(this).text() });
      showMessage(text, 3000);
    });
  });
  $.each(result.click, function(index, tips) {
    $(document).on('click', tips.selector, function() {
      var text = getRandText(tips.text);
      text = text.render({ text: $(this).text() });
      showMessage(text, 3000, true);
    });
  });
  $.each(result.seasons, function(index, tips) {
    var now = new Date();
    var after = tips.date.split('-')[0];
    var before = tips.date.split('-')[1] || after;

    if (
      after.split('/')[0] <= now.getMonth() + 1 &&
      now.getMonth() + 1 <= before.split('/')[0] &&
      (after.split('/')[1] <= now.getDate() &&
        now.getDate() <= before.split('/')[1])
    ) {
      var text = getRandText(tips.text);
      text = text.render({ year: now.getFullYear() });
      showMessage(text, 6000, true);
    }
  });

  if (live2d_settings.showF12OpenMsg) {
    re.toString = function() {
      showMessage(getRandText(result.waifu.console_open_msg), 5000, true);
      return '';
    };
  }

  if (live2d_settings.showCopyMessage) {
    $(document).on('copy', function() {
      showMessage(getRandText(result.waifu.copy_message), 5000, true);
    });
  }

  $('.waifu-tool .fui-photo').click(function() {
    showMessage(getRandText(result.waifu.screenshot_message), 5000, true);
    window.Live2D.captureName = live2d_settings.screenshotCaptureName;
    window.Live2D.captureFrame = true;
  });

  $('.waifu-tool .fui-cross').click(function() {
    sessionStorage.setItem('waifu-dsiplay', 'none');
    showMessage(getRandText(result.waifu.hidden_message), 1300, true);
    window.setTimeout(function() {
      $('.waifu').hide();
    }, 1300);
  });

  window.showWelcomeMessage = function(result) {
    var text;
    if (window.location.href == live2d_settings.homePageUrl) {
      var now = new Date().getHours();
      if (now > 23 || now <= 5)
        text = getRandText(result.waifu.hour_tips.t23 - 5);
      else if (now > 5 && now <= 7)
        text = getRandText(result.waifu.hour_tips.t5 - 7);
      else if (now > 7 && now <= 11)
        text = getRandText(result.waifu.hour_tips.t7 - 11);
      else if (now > 11 && now <= 14)
        text = getRandText(result.waifu.hour_tips.t11 - 14);
      else if (now > 14 && now <= 17)
        text = getRandText(result.waifu.hour_tips.t14 - 17);
      else if (now > 17 && now <= 19)
        text = getRandText(result.waifu.hour_tips.t17 - 19);
      else if (now > 19 && now <= 21)
        text = getRandText(result.waifu.hour_tips.t19 - 21);
      else if (now > 21 && now <= 23)
        text = getRandText(result.waifu.hour_tips.t21 - 23);
      else text = getRandText(result.waifu.hour_tips.default);
    } else {
      var referrer_message = result.waifu.referrer_message;
      if (document.referrer !== '') {
        var referrer = document.createElement('a');
        referrer.href = document.referrer;
        var domain = referrer.hostname.split('.')[1];
        if (window.location.hostname == referrer.hostname)
          text =
            referrer_message.localhost[0] +
            document.title.split(referrer_message.localhost[2])[0] +
            referrer_message.localhost[1];
        else if (domain == 'baidu')
          text =
            referrer_message.baidu[0] +
            referrer.search.split('&wd=')[1].split('&')[0] +
            referrer_message.baidu[1];
        else if (domain == 'so')
          text =
            referrer_message.so[0] +
            referrer.search.split('&q=')[1].split('&')[0] +
            referrer_message.so[1];
        else if (domain == 'google')
          text =
            referrer_message.google[0] +
            document.title.split(referrer_message.google[2])[0] +
            referrer_message.google[1];
        else {
          $.each(result.waifu.referrer_hostname, function(i, val) {
            if (i == referrer.hostname) referrer.hostname = getRandText(val);
          });
          text =
            referrer_message.default[0] +
            referrer.hostname +
            referrer_message.default[1];
        }
      } else
        text =
          referrer_message.none[0] +
          document.title.split(referrer_message.none[2])[0] +
          referrer_message.none[1];
    }
    showMessage(text, 6000);
  };
  if (live2d_settings.showWelcomeMessage) showWelcomeMessage(result);

  var waifu_tips = result.waifu;

  function loadOtherModel() {
    var modelId = modelStorageGetItem('modelId');
    var modelRandMode = live2d_settings.modelRandMode;

    $.ajax({
      cache: modelRandMode == 'switch' ? true : false,
      url: live2d_settings.modelAPI + modelRandMode + '/?id=' + modelId,
      dataType: 'json',
      success: function(result) {
        loadModel(result.model['id']);
        var message = result.model['message'];
        $.each(waifu_tips.model_message, function(i, val) {
          if (i == result.model['id']) message = getRandText(val);
        });
        showMessage(message, 3000, true);
      }
    });
  }

  function loadRandTextures() {
    var modelId = modelStorageGetItem('modelId');
    var modelTexturesId = modelStorageGetItem('modelTexturesId');
    var modelTexturesRandMode = live2d_settings.modelTexturesRandMode;

    $.ajax({
      cache: modelTexturesRandMode == 'switch' ? true : false,
      url:
        live2d_settings.modelAPI +
        modelTexturesRandMode +
        '_textures/?id=' +
        modelId +
        '-' +
        modelTexturesId,
      dataType: 'json',
      success: function(result) {
        if (
          result.textures['id'] == 1 &&
          (modelTexturesId == 1 || modelTexturesId == 0)
        )
          showMessage(waifu_tips.load_rand_textures[0], 3000, true);
        else showMessage(waifu_tips.load_rand_textures[1], 3000, true);
        loadModel(modelId, result.textures['id']);
      }
    });
  }

  function modelStorageGetItem(key) {
    return live2d_settings.modelStorage
      ? localStorage.getItem(key)
      : sessionStorage.getItem(key);
  }

  /* 检测用户活动状态，并在空闲时显示一言 */
  if (live2d_settings.showHitokoto) {
    window.getActed = false;
    window.hitokotoTimer = 0;
    window.hitokotoInterval = false;
    $(document)
      .mousemove(function(e) {
        getActed = true;
      })
      .keydown(function() {
        getActed = true;
      });
    setInterval(function() {
      if (!getActed) ifActed();
      else elseActed();
    }, 1000);
  }

  function ifActed() {
    if (!hitokotoInterval) {
      hitokotoInterval = true;
      hitokotoTimer = window.setInterval(showHitokotoActed, 30000);
    }
  }

  function elseActed() {
    getActed = hitokotoInterval = false;
    window.clearInterval(hitokotoTimer);
  }

  function showHitokotoActed() {
    if ($(document)[0].visibilityState == 'visible') showHitokoto();
  }

  function showHitokoto() {
    switch (live2d_settings.hitokotoAPI) {
      case 'lwl12.com':
        $.getJSON('https://api.lwl12.com/hitokoto/v1?encode=realjson', function(
          result
        ) {
          if (!empty(result.source)) {
            var text = waifu_tips.hitokoto_api_message['lwl12.com'][0];
            if (!empty(result.author))
              text += waifu_tips.hitokoto_api_message['lwl12.com'][1];
            text = text.render({
              source: result.source,
              creator: result.author
            });
            window.setTimeout(function() {
              showMessage(
                text + waifu_tips.hitokoto_api_message['lwl12.com'][2],
                3000,
                true
              );
            }, 5000);
          }
          showMessage(result.text, 5000, true);
        });
        break;
      case 'fghrsh.net':
        $.getJSON(
          'https://api.fghrsh.net/hitokoto/rand/?encode=jsc&uid=3335',
          function(result) {
            if (!empty(result.source)) {
              var text = waifu_tips.hitokoto_api_message['fghrsh.net'][0];
              text = text.render({ source: result.source, date: result.date });
              window.setTimeout(function() {
                showMessage(text, 3000, true);
              }, 5000);
              showMessage(result.hitokoto, 5000, true);
            }
          }
        );
        break;
      case 'jinrishici.com':
        $.ajax({
          url: 'https://v2.jinrishici.com/one.json',
          xhrFields: { withCredentials: true },
          success: function(result, status) {
            if (!empty(result.data.origin.title)) {
              var text = waifu_tips.hitokoto_api_message['jinrishici.com'][0];
              text = text.render({
                title: result.data.origin.title,
                dynasty: result.data.origin.dynasty,
                author: result.data.origin.author
              });
              window.setTimeout(function() {
                showMessage(text, 3000, true);
              }, 5000);
            }
            showMessage(result.data.content, 5000, true);
          }
        });
        break;
      default:
        $.getJSON('https://v1.hitokoto.cn', function(result) {
          if (!empty(result.from)) {
            var text = waifu_tips.hitokoto_api_message['hitokoto.cn'][0];
            text = text.render({
              source: result.from,
              creator: result.creator
            });
            window.setTimeout(function() {
              showMessage(text, 3000, true);
            }, 5000);
          }
          showMessage(result.hitokoto, 5000, true);
        });
    }
  }

  $('.waifu-tool .fui-eye').click(function() {
    loadOtherModel();
  });
  $('.waifu-tool .fui-user').click(function() {
    loadRandTextures();
  });
  $('.waifu-tool .fui-chat').click(function() {
    showHitokoto();
  });
}
