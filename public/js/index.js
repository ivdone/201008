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
        tbd.append(`<tr id="row${i}">
                    <td>${data[i].date}</td>
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
    card.find(".time-from-now").html(moment(time).fromNow());
    card.find(".hg").html(match.home_team.goals);
    card.find(".ag").html(match.away_team.goals);
  }

  function getCurrentMatch() {
    $.get("https://worldcup.sfg.io/matches/today?by_date=asc", function(data) {
      var ginfo = $("#game-info");
      for (i = 0; i < data.length; i++) {
        var match = data[i];
        
        var ele = ginfo.append(`<div class="class="col-xl-3 col-md-6 col-sm-12">
                        <div id="${match.fifa_id}" class="card game-info-card" style="text-align:center;">
                          <div class="card-body">
                            <div>
                              <img src="http://www.countryflags.io/${countryCodes[match.home_team.code]}/flat/64.png"> vs. <img src="http://www.countryflags.io/${countryCodes[match.away_team.code]}/flat/64.png">
                            </div>
                            <span class="badge badge-info">Unknown</span>
                            <br/>
                            <span class="time-from-now">Unknown</span>
                            <div class="scores"><span class="hg">0</span> - <span class="ag">0</span></div>
                          </div>
                        </div>
                      </div>`);

        refreshMatch(match);
      }
    }, 'json');
  }

  $("#submit").click(function(){    
    var form = $("#bet-form");
    form.addClass("was-validated");

    if (form[0].checkValidity() === false) {
      return;
    }

    var hg=$("#hg").val();
    var ag=$("#ag").val();
    var bet=$("#bet").val();
    $.post("/bet", {homegoal : hg, awaygoal : ag, nbet : bet}, function(data){
      if (data === "success") {
        Alert.success("<strong>投注成功!</strong> You have successfully registered your bet</a>.");
      } else {
        Alert.warn("<strong>投注失败!</strong> Try submitting again.");
      }
      form.removeClass("was-validated");
      refreshList();
    }, 'text');
  });

  refreshList();
  getCurrentMatch();
});