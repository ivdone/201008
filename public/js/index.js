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
  
  $("#submit").click(function(){
    var hg=$("#hg").val();
    var ag=$("#ag").val();
    var bet=$("#bet").val();
    $.post("/bet", {homegoal : hg, awaygoal : ag, nbet : bet}, function(data){
      if (data === "success") {
        Alert.success("<strong>投注成功!</strong> You successfully registered your bet</a>.");
      } else {
        Alert.warn("<strong>投注失败!</strong> Try submitting again.");
      }

      refreshList();
    }, 'text');
  });

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
});