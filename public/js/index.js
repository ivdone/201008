$(document).ready(function(){
  var user,pass;
  $("#alert-success").hide();
  $("#alert-warn").hide();
  Alert = {
    show: function($div, msg) {
      $div.find('.alert-msg').html(msg);
      if ($div.css('display') === 'none') {
        // fadein, fadeout.
        $div.fadeIn(1000).delay(2000).fadeOut(2000);
      }
    },
    success: function(msg) {
      this.show($('#alert-success'), msg);
    },
    warn: function(msg) {
      this.show($('#alert-warn'), msg);
    }
  }

  function refreshList() {
    $.get("/transactions/my", function(data) {
      var tbd = $("#historyTable");
      var rowCount = $('#historyTable tr').length;
      for (i = rowCount; i < data.length; i++) {
        var bt = data[i].bettime || "赛前"

        tbd.append(`<tr id="row${i}">
                    <td>${bt}</td>
                    <td>${data[i].fid}</td>
                    <td>${data[i].hg}</td>
                    <td>${data[i].ag}</td>
                    <td>${data[i].bet}</td>
                    </tr>`);
      }
    });
  }

  countryCodes = {
    URU : "UY",
    POR : "PT",
    FRA : "FR",
    ARG : "AR",
    BRA : "BR",
    MEX : "MX",
    BEL : "BE",
    JPN : "JP",
    ESP : "ES",
    RUS : "RU",
    HRV : "HR",
    DNK : "DK",
    SWE : "SE",
    CHE : "CH",
    COL : "CO",
    GBR : "GB",
  };

  badgemap = {
    "completed" : "badge-success",
    "future" : "badge-info",
  }

  statusmap = {
    "completed" : "已完成",
    "future" : "即将开始"
  }
  function refreshMatch(match) {
    var card = $("#" + match.fifa_id);
    const time = new Date(match.datetime);

    var badge = badgemap[match.status] || "badge-danger";
    var badgetext = statusmap[match.status] || "直播中";
    card.find(".badge").removeClass().addClass("badge").addClass(badge).html(badgetext);
    card.find(".hg").html(match.home_team.goals);
    card.find(".ag").html(match.away_team.goals);
    card.find(".time-from-now").html(moment(time).fromNow());
    if (match.time) {
      card.find(".match-time").html(match.time).show();
      card.find(".time-from-now").html(moment(time).fromNow()).hide();

      if (match.time === "full-time" || parseInt(match.time.substr(0, 2)) >= 80) {
        card.find("input").prop('disabled', true);
        card.find("button").prop('disabled', true).off("click");
      }
    } else {
      card.find(".match-time").html(match.time).hide();
      card.find(".time-from-now").html(moment(time).fromNow()).show();
    }

  }

  function appendMatch(match) {
    var ginfo = $("#game-info");
    var ele = ginfo.append(`<div class="class="col-xl-3 col-md-6 col-sm-12">
                        <div id="${match.fifa_id}" class="card game-info-card" style="text-align:center;">
                          <div class="card-body">
                            <div>
                              <img src="http://www.countryflags.io/${countryCodes[match.home_team.code]}/flat/64.png"> vs. <img src="http://www.countryflags.io/${countryCodes[match.away_team.code]}/flat/64.png">
                            </div>
                            <span class="badge badge-info">Unknown</span>
                            <br/>
                            <div class="scores"><span class="hg">0</span> - <span class="ag">0</span></div>
                            <span class="time-from-now">Unknown</span>
                            <span class="match-time"></span>
                          </div>
                        </div>
                      </div>`);

    var form = $("#"+match.fifa_id).append(`
        <form class="needs-validation border" id="bet-form${match.fifa_id}" novalidate>
          <div class="row">
            <div class="col">
              <input type="number" id="hg${match.fifa_id}" min="0" max="5" class="form-control" aria-label="主队" required>
            </div>
              -
            <div class="col">
              <input type="number" id="ag${match.fifa_id}" min="0" max="5" class="form-control" aria-label="客队" required>
            </div>
          </div>
          <div class="row">
            <div class="col">                
              <div class="input-group input-group-sm">
                <div class="input-group-prepend">
                  <span class="input-group-text">$(1 - 200)</span>
                </div>
                <input type="number" id="bet${match.fifa_id}" min="1" max="200" class="form-control" aria-label="下注金额" required>
              </div>
            </div>
            <div class="col">
              <button type="button" id="submit${match.fifa_id}" class="btn btn-primary mb-2">下注</button>
            </div>
          </div>
          </div>
      </form>
    `);

    $("#submit" + match.fifa_id).click(
      function(fid) {
        return function() {
          var form = $("#bet-form" + fid);
          form.addClass("was-validated");
      
          if (form[0].checkValidity() === false) {
            return;
          }
      
          var hg=$("#hg"+ fid).val();
          var ag=$("#ag" + fid).val();
          var bet=$("#bet" + fid).val();
          $.post("/bet", {homegoal : hg, awaygoal : ag, nbet : bet, fid : fid, bet_time : $("#" + match.fifa_id).find(".match-time").html()}, function(data){
            if (data === "success") {
              Alert.success("<strong>投注成功!</strong> You have successfully registered your bet</a>.");
            } else {
              Alert.warn("<strong>投注失败!</strong> Try submitting again.");
            }
            form.removeClass("was-validated");
            refreshList();
          }, 'text');
        };
      }(match.fifa_id));
  }

  function getCurrentMatch() {
    $.get("https://worldcup.sfg.io/matches/today?by_date=asc", function(data) {
      for (i = 0; i < data.length; i++) {
        var match = data[i];
        appendMatch(match);        
        refreshMatch(match);
      }
    }, 'json');
  }  

  refreshList();
  getCurrentMatch();

  window.setInterval(function(){
    $.get("https://worldcup.sfg.io/matches/today?by_date=asc", function(data) {
      for (i = 0; i < data.length; i++) {
        var match = data[i];
        if ($("#"+match.fifa_id) !== undefined)
          refreshMatch(match);
        else
          appendMatch(match);
      }
    }, 'json');
  }, 10000);
});