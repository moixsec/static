function drawChart(stats)
{
    var dataOccurrences = new google.visualization.DataTable();
    dataOccurrences.addColumn('string', 'Task');
    dataOccurrences.addColumn('number', 'Hours per Day');

    var riskOccurrences = new google.visualization.DataTable();
    riskOccurrences.addColumn('string', 'Task');
    riskOccurrences.addColumn('number', 'Hours per Day');

    for (var t in stats.bugsFound)
    {
        dataOccurrences.addRows([
            [t + '(' + stats.bugsFound[t] + ')', stats.bugsFound[t]]
        ]);
    }
    for (var t in stats.risks)
    {
        riskOccurrences.addRows([
            [t + '(' + stats.risks[t] + ')', stats.risks[t]]
        ]);
    }
    var options = {
        title: 'Occurrences',
        is3D: true,
        chartArea: {right: "100%"}

    };

    var optionsRisk = {
        title: 'Risk',
        is3D: true,
        chartArea: {right: "100%"}

    };

    var occurrencesChart = new google.visualization.PieChart(document.getElementById('occurrences_chart'));
    occurrencesChart.draw(dataOccurrences, options);

    var riskChart = new google.visualization.PieChart(document.getElementById('risk_chart'));
    riskChart.draw(riskOccurrences, optionsRisk);
}
$('#scanButton').on('click', function ()
{
    // validation
    if ($('#scanInput').val().length < 4)
    {
        alert('Please, type a valid target URL before scanning.')
        return;
    }
    else if ($("input[id*='termsConditions']:checked").length <= 0)
    {
        $('#termsError').css('visibility', '');
        return;
    }

    // show loading stuff
    if ($('#collapseSettings').hasClass('collapse in') == true)
    {
        $('#collapseSettings').removeClass('collapse in');
        $('#collapseSettings').addClass('collapse');
    }
    $('#termsError').css('visibility', 'hidden');


    $('.scanner').addClass('scannermodal');
    $('#scanPanel').hide();
    $('.loading').show();
    var span = document.getElementById('scanninganimation');

    var int = setInterval(function ()
    {
        window.onbeforeunload = function ()
        {
            return "Scan still in progress, are you sure you want to leave?";
        };
        switch (span.innerHTML.replace(/&nbsp;/g, '').length)
        {
            case 0 :
                span.innerHTML = '.&nbsp;&nbsp;';
                break;
            case 1 :
                span.innerHTML = '..&nbsp;';
                break;
            case 2 :
                span.innerHTML = '...';
                break;
            case 3 :
                span.innerHTML = '&nbsp;&nbsp;&nbsp;';
                break;
        }
    }, 400);


    // request the scan
    var jobData =
    {
        'target': $('#scanInput').val(),
        'analyzer.rxss': $('#analyzer\\.rxss').val(),
        'analyzer.dom': $('#analyzer\\.dom').val(),
        'maxHopsPerSink': $('#maxHopsPerSink').val(),
        'workerTabs': $('#workerTabs').val(),
        'scanner.subdomains': $('#scanner\\.subdomains').val(),
        'scanner.path': $('#scanner\\.path').val(),
        'spider.agent': $('#spider\\.agent').val(),
        'spider.click': $('#spider\\.click').val(),
        'spider.events': $('#spider\\.events').val(),
        'spider.forms': $('#spider\\.forms').val(),
        'spider.links': $('#spider\\.links').val(),
    };
    $.ajax(
        {
            type: "POST",
            url: "/moixInspect",
            // dataType: "json",
            data: JSON.stringify(jobData),
            timeout: 180000, // 3 mins
            success: function (result)
            {
                $('#scanPanel').css('padding', '0px');
                $('.loading').hide();
                clearInterval(int);
                $('.scanner').removeClass('scannermodal');
                $('#NumberBugsFound').show();
                $('#charts').show();
                $('#Processed').show();

                $('#targetResults').text('Analysis results for ' + jobData.target);
                $('#targetResults').show();
                var data = JSON.parse(result.substring(0, result.length - 1));
                $("#bugsFound").html(atob(data.results));
                drawChart(JSON.parse(atob(data.stats)));
                window.onbeforeunload = null;
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                if (textStatus === "timeout")
                {
                    alert("Call has timed out"); //Handle the timeout
                }
                else
                {
                    console.log("Another error was returned");
                    console.log(textStatus);
                    console.log(errorThrown);
                }
            }
    });
}); 