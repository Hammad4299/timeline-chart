'use strict';
var Timeline = function (container) {
    this.container = container;
    this.items = [];
    this.itemsMap = null;
    this.groups = undefined;
    this.fixedProps = {};
    this.step = 60;
    this.stepLabels = [];
    this.min = moment('23:59','HH:mm');
    this.max = moment('00:01','HH:mm');
    this.timeLabels = [];
}

Timeline.prototype.addGroup = function (name, id, color) {
    if(!this.groups)
        this.groups = [];

    this.groups.push({
        id: id,
        content: name,
        style: "background-color: "+color+"!important"
    })
}

Timeline.prototype.duration = function (time,unit) {
    return time.diff(this.min,unit);
}

Timeline.prototype.timeStep = function (time,unit) {
    return Math.floor(this.duration(time,unit)/this.step);
}

Timeline.prototype.initTimeline = function () {
    var self = this;
    var startDate = self.min;
    this.timeLabels = [];
    var steps = Math.floor(self.max.diff(startDate,'minutes')/self.step)+1;

    for(var x=0;x<steps;++x) {
        var date = startDate.clone().add(x*self.step,'minutes');
        var sDate = date.clone();
        var obj  = {
            start: sDate,
            actual: date.clone(),
            end: sDate.clone().add(self.step,'minutes')
        };

        if(self.fixedProps && self.fixedProps.length==2){
            var fixedStartStep = self.timeStep(self.fixedProps[0].start,'minutes');
            var fixedEndStep = self.timeStep(self.fixedProps[1].start,'minutes');
            var cStep = self.timeStep(date,'minutes');
            var mins = self.duration(self.fixedProps[1].toShow,'minutes');
            var minsStep = Math.ceil(mins/self.step);

            if(minsStep == mins/self.step){
                minsStep++;
            }

            if(cStep==fixedStartStep+1){ //Before fixed
                obj.start = self.fixedProps[0].toShow;
                if(self.stepLabels.length>0){
                    self.stepLabels[self.stepLabels.length-1].end = obj.start;
                }

                obj.end = obj.start;
            //}
            // else if(cStep == fixedStartStep+2){//>fixedStartStep && cStep<=fixedEndStep) {
            //     obj.start = undefined;
            //     obj.end = self.fixedProps[1].toShow;
            } else if(cStep == fixedStartStep+2) {
                obj.start  = self.fixedProps[1].toShow;
            } else if (cStep > fixedEndStep){
                var e = self.stepLabels[self.stepLabels.length-1].start;
                var s = self.timeStep(e,'minutes');

                var d = self.min.clone().add((s+1)*self.step,'minutes');
                obj.start = d;

                if(cStep == fixedStartStep+3){
                    self.stepLabels[self.stepLabels.length-1].end = obj.start;
                }
            }
        }

        if(!obj.s)
            obj.s = obj.start;

        self.stepLabels.push(obj);
    }
}

Timeline.prototype.showTimeLabels = function (text, item) {
    var self = this;
    this.displayTextLabel(self.getLabelLeft(item.id),text,item.className);
};

Timeline.prototype.showFixedText = function () {
    if(this.fixedProps && this.fixedProps.length==2){
        var self = this;
        var it1 = this.fixedProps[0];
        var it2 = this.fixedProps[1];
        var left1 = self.getLabelLeft(it1.id)+20;
        var left2 = self.getLabelLeft(it2.id)+20;
        var text = moment.duration(it2.toShow.clone().diff(it1.toShow,'minutes'),'minutes').format('HH:mm');

        if(left2<left1){
            var t = left1;
            left1 = left2;
            left2 = t;
        }

        this.displayTextLabel(left1, text, it1.className+' fixed',left2-left1);
    }
};

Timeline.prototype.clearLabels = function () {
    $(this.container).find('.tm-time-label').remove();
    this.timeLabels = {};
}

Timeline.prototype.displayTextLabel = function (left, text, className, width) {
    var self = this;
    var maxind = 0;
    left = Math.floor(left);
    for(var x=left-25;x<=left+25;++x){
        if(self.timeLabels[x]){
            self.timeLabels[x]++;
        }else{
            self.timeLabels[x]=1;
        }
        if(self.timeLabels[x]>maxind)
            maxind = self.timeLabels[x];
    }

    for(var x=left-25;x<=left+25;++x){
        self.timeLabels[x] = maxind;
    }

    var top = 0-(maxind*25);
    var template= $("<span class='tm-time-label'></span>");
    template.css('top',top+'px');
    template.css('position','absolute');
    template.css('left',left+'px');
    if(width)
        template.css('width',width+'px');
    template.text(text);
    template.addClass(className);
    $(self.container).append(template);
}

Timeline.prototype.getLabelLeft = function (itemId) {
    var it = $(this.container).find('[data-id='+itemId+']');
    var left=  parseInt(it.css('left'));
    left += parseInt($(this.container).find('[data-id='+itemId+']').parents('.vis-panel').css('left'));
    var width = it.width();
    var right = left+width;
    var center = (left+right)/2;
    return center-20;
}

Timeline.prototype.setItems = function (items) {
    var self = this;
    this.items = [];
    this.itemsMap = {};
    var insicionFound = false;


    items.map(function (item) {
        var nItem = {};
        for(var prop in item){
            nItem[prop] = item[prop];
        }
        //if(!nItem.id)
            nItem.id = self.items.length;

        if(item.group === undefined && !item.className){
            nItem.className = "pallete-color-"+Math.floor(((Math.random()*100)%5)+1);
        }

        if(item.parent){
            if(!nItem.className)
                nItem.className = '';

            nItem.className += ' ' + item.parent;
        }

        nItem['toShow'] = item.start;

        if(nItem['toShow'].clone().diff(self.min,'minutes')<0){
            self.min = nItem['toShow'].clone();
        }

        if(nItem['toShow'].clone().diff(self.max,'minutes')>0){
            self.max = nItem['toShow'].clone();
        }

        if(self.fixedProps && self.fixedProps.length==1) {
            self.fixedProps.push(nItem);    //Next to fixed one.
        }

        if(!insicionFound && item.fixed){
            insicionFound = true;
            self.fixedProps = [nItem];
        }

        self.items.push(nItem);
        self.itemsMap[nItem.id] = nItem;
    });

    self.min = self.min.startOf('hour').add('-1','hour');
    self.max = self.max.endOf('hour').add('1','hour');

    console.log(self.min.format('HH:mm'));
};

Timeline.prototype.resolveScaledTime = function (time) {
    var self = this;
    var toRet = time;
    var start = null;
    var pre = null;

    self.stepLabels.map(function (stepLabel) {
        var diff = 0;
        var diff2 = 0;

        if(stepLabel.s && stepLabel.end){
            diff = time.clone().diff(stepLabel.s, 'minutes');
            diff2 = time.clone().diff(stepLabel.end, 'minutes');

            if(diff>=0 && diff2 <= 0){
                start = stepLabel;
            }
        }
    });

    if(start){
        var len = start.end.clone().diff(start.s,'minutes');
        var scale = Math.ceil(self.step/len);
        var d = time.clone().diff(start.s,'minutes');
        toRet = start.actual.clone().add(d/scale,'minutes');
    }
    return toRet;
}

Timeline.prototype.prepare = function () {
    var self = this;
    this.items.map(function (item) {
        item.start = self.resolveScaledTime(item.start);
    });
}

Timeline.prototype.showTimelineLabels = function () {
    var elems = $(this.container).find('.vis-text.vis-minor.vis-todayvis-even');
    var e = this.stepLabels;
    for(var x=0;x<this.stepLabels.length;++x){
        //var cStep = Math.floor(date.diff(self.min,'minutes')/self.step);
        var cStep = x;
        if(!e[cStep] || !e[cStep].start)
            continue;

        var toRet = e[cStep].start.format('HH:mm');
        elems.eq(x).text(toRet);
    }
}

Timeline.prototype.getOptions = function () {
    var _this = this;
    return {
        stack:true,
        timeAxis: {
            scale:'minute',
            step:_this.step
        },
        orientation: {
            axis: 'top',
            item: 'top'
        },
        format: {
            minorLabels: function (date, scale, step) {
                return "";
            }
        },
        showMajorLabels: false,
//        showMinorLabels: false,
        horizontalScroll: false,
        moveable: false,
        autoResize: false,
        dataAttributes: ['id'],
        start: _this.min,
        end: _this.max,
        zoomable: false,
        showCurrentTime: false,
        template: function (item, element, data) {
            var t = "";
            if(item.toShow)
                t = item.toShow.format('HH:mm');

            var classN = item.className;
            var html = '<div class="vis-item-content '+classN+'">' +
                            '<i class="fa"></i>' +
                            '<span>'+item.content+'</span>' +
                            '<div><small><b>'+t+'</b></small></div>'+
                        '</div>';
            var h = $(html);

            if(item.type!='background'){
                if(item.Status == "Start"){
                    h.find('.fa').addClass('fa-chevron-up');
                    h.find('.fa').addClass('start-arrow');
                }else{
                    h.find('.fa').addClass('fa-chevron-down');
                    h.find('.fa').addClass('complete-arrow');
                }
            }

            return h.html();
        }
    };
}

Timeline.prototype.draw = function () {
    if(this.timeline)
        this.timeline.destroy();
    var that = this;
    var _this = that;


    var options = this.getOptions();
    var g = null;
    var its = _this.items.slice();

    if(_this.groups){
        g = _this.groups.slice();
        g.map(function (it) {
            its.push({
                type: 'background',
                start: _this.min,
                end: _this.max,
                group: it.id,
                content: '',
                style: it.style
            });
        })
    }

    var items = new vis.DataSet(its);
    _this.timeline = new vis.Timeline(_this.container, items,g,options);
    _this.timeline.on('changed',function () {

        setTimeout(function () {
            _this.clearLabels();
            // its.map(function (item) {
            //     if(item.toShow)
            //         _this.showTimeLabels(item.toShow.format('HH:mm'),item);
            // });

            _this.showFixedText();
            _this.showTimelineLabels();
        },1000);
    })
}

function setLabels(jsonData, container) {
    var temp = $('#labelHtml').html();
    var insIn = container.parents('.js-chart-section').find('.js-labels');



    var toAdd = []
    toAdd.push({
        Name: "Scheduled Date & Time (Start)",
        Value: jsonData.SchStartTime
    });

    toAdd.push({
        Name: "Scheduled Date & Time (End)",
        Value: jsonData.SchEndTime
    });

    toAdd.push({
        Name: "OR#",
        Value: jsonData.OR
    });


    toAdd.push({
        Name: "Case #",
        Value: jsonData.Case
    });

    toAdd.push({
        Name: "Patient",
        Value: jsonData.Name
    });

    toAdd.push({
        Name: "Procedure",
        Value: jsonData.ProcName
    });

    toAdd.push({
        Name: "Speciality",
        Value: jsonData.Specialty
    });

    toAdd.push({
        Name: "Specialty",
        Value: jsonData.Specialty
    });

    var a = jsonData.roles.slice();
    for(var x=toAdd.length-1;x>=0;--x)
        a.unshift(toAdd[x]);

    a.map(function (it) {
        var toAdd = $(temp);
        if(it.Value!=""){
            toAdd.find('.js-name').text(it.Name);
            toAdd.find('.js-value').text(it.Value);
            insIn.append(toAdd);
        }
    })
}

function getData(arr) {
    var data = [];
    arr.map(function (it) {
        data.push({
            id: it.ObjectId,
            content: it.Name,
            parent: it.Parent,
            Status: it.Status,
            fixed: it.SqueezeAfter,
            start: moment(moment(it.TimeStamp,'YYYY-MM-DD HH:mm').format('HH:mm'),'HH:mm')
        });
    });

    return data;
}

function setFooter(data, container) {
    container.find('.js-status').text(data.Status);

    container.find('.js-lst').each(function () {
        var prop = $(this).attr('data-prop');
        if(data[prop] && data[prop].length>0){
            var ol = $(this).find('ol');
            var toAdd = '<li></li>';
            data[prop].map(function (it) {
                var toIns = $(toAdd);
                toIns.text(it.Note);
                ol.append(toIns);
            })
        }else{
            $(this).addClass('hidden');
        }
    })
}

$(document).ready(function () {
    $(document).on('click','.js-show-detail',function () {
        var val = $(this).attr('data-val');
        var parent = $('.js-patient-chart');
        parent.find('[data-show]').each(function () {
            if($(this).attr('data-show').indexOf(val)!=-1){
                $(this).removeClass('hidden');
                $(this).find('.js-vs-chart').data('tm').draw();
            }
        })
    });

    $(document).on('click','.js-print-page',function () {
        window.print();
    })


    var jsonData = JSON.parse($('#hdnJsonReport').val());
    var container = $('.js-charts-container');
    var chartsTemp = $('#chart-temp').html();
    var legends = $('#legends-temp').html();

    var initialPage = {
        leftImg: $('#left-header-img'),
        rightImg: $('#right-header-img'),
        schCases: $('.js-scheduled-cases'),
        comCases: $('.js-completed-cases'),
        ontimeCases: $('.js-ontime'),
        scrshot: $('#scrshot')
    };


    initialPage.leftImg.attr('src',jsonData.ImageIcon1);
    initialPage.rightImg.attr('src',jsonData.ImageIcon2);
    initialPage.schCases.text(jsonData.ScheduledCases);
    initialPage.comCases.text(jsonData.CompletedCases);
    initialPage.ontimeCases.text(jsonData.OnTimeStarts);
    initialPage.scrshot.attr('src',jsonData.ReportImage);

    var i = 0;
    var arr = [];
    jsonData.PatientUpdate.map(function (patient) {
        var data = patient;
        data.stages = {};

        patient.stageupdates.map(function (stage) {
            if(!data.stages[stage.Parent])
                data.stages[stage.Parent] = [];

            data.stages[stage.Parent].push(stage);
        });

        data.groups = [];
        var toIns = $(chartsTemp);
        toIns.attr('data-chart-id',i);
        container.append(toIns);


        var chartsContainer = container.find('[data-chart-id='+i+']');

        var preop = chartsContainer.find('.js-preop')[0];
        var interop = chartsContainer.find('.js-interop')[0];
        var postop = chartsContainer.find('.js-postop')[0];
        var summary = chartsContainer.find('.js-summary')[0];
        $(preop).parents('.js-chart-section').append(legends);
        $(postop).parents('.js-chart-section').append(legends);
        $(interop).parents('.js-chart-section').append(legends);
        $(summary).parents('.js-chart-section').append(legends);

        var sumTime = new Timeline(summary);
        var preTime = new Timeline(preop);
        var interTime = new Timeline(interop);
        var postTime = new Timeline(postop);

        arr.push(sumTime);
        arr.push(preTime);
        arr.push(interTime);
        arr.push(postTime);

        var id = 0;
        var its = [];
        for(var prop in patient.summary){
            var color = "";
            if(prop == 'Patient'){
                color = jsonData.Palette.Patient;
            }else if(prop == 'Nursing'){
                color = jsonData.Palette.Nursing;
            }else if(prop == 'EMS'){
                color = jsonData.Palette.EMS;
            }else if(prop == 'Anesthesia'){
                color = jsonData.Palette.Anesthesia;
            }else if(prop == 'Surgeon'){
                color = jsonData.Palette.Surgeon;
            }

            sumTime.addGroup(prop,id,color);

            patient.summary[prop].map(function (it) {
                its.push({
                    content: it.Name,
                    Status: it.Status,
                    group: id,
                    start: moment(moment(it.Timestamp,'YYYY-MM-DD HH:mm').format('HH:mm'),'HH:mm')
                })
            });

            id++;
        }

        its.unshift({
            content: "Scheduled Start Time",
            Status: "Start",
            group: 0,
            className: 'special-box',
            start: moment(moment(data.SchStartTime,'MM/DD/YYYY hh:mm:ss A').format('HH:mm'),'HH:mm')
        });

        its.unshift({
            content: "Scheduled End Time",
            Status: "End",
            group: 0,
            className: 'special-box',
            start: moment(moment(data.SchEndTime,'MM/DD/YYYY hh:mm:ss A').format('HH:mm'),'HH:mm')
        });

        sumTime.setItems(its);
        its = getData(data.stages.IntraOp);
        its.unshift({
            content: "Scheduled Start Time",
            Status: "Start",
            group: 0,
            className: 'special-box',
            start: moment(moment(data.SchStartTime,'MM/DD/YYYY hh:mm:ss A').format('HH:mm'),'HH:mm')
        });

        its.unshift({
            content: "Scheduled End Time",
            Status: "End",
            group: 0,
            className: 'special-box',
            start: moment(moment(data.SchEndTime,'MM/DD/YYYY hh:mm:ss A').format('HH:mm'),'HH:mm')
        });

        preTime.setItems(getData(data.stages.PreOp));
        interTime.setItems(its);
        postTime.setItems(getData(data.stages.PostOp,'Pre'));
        sumTime.initTimeline();
        preTime.initTimeline();
        interTime.initTimeline();
        postTime.initTimeline();
        sumTime.prepare();
        preTime.prepare();
        interTime.prepare();
        postTime.prepare();

        sumTime.draw();
        interTime.draw(true);
        preTime.draw();
        postTime.draw();

        $(preop).data('tm',preTime);
        $(interop).data('tm',interTime);
        $(postop).data('tm',postTime);
        $(summary).data('tm',sumTime);

        setLabels(data,$(preop));
        setLabels(data,$(summary));
        setLabels(data,$(postop));
        setLabels(data,$(interop));

        setFooter(data,$(preop).parents('.js-chart-section'));
        setFooter(data,$(summary).parents('.js-chart-section'));
        setFooter(data,$(postop).parents('.js-chart-section'));
        setFooter(data,$(interop).parents('.js-chart-section'));
        ++i;
    })
})
