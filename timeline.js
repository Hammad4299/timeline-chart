'use strict';
var Timeline = function (container) {
    this.container = container;
    this.items = [];
    this.itemsMap = null;
    this.groups = undefined;
    this.fixedProps = {};
    this.step = 60;
    this.stepLabels = [];
    this.min = moment('06:00','HH:mm');
    this.max = moment('20:30','HH:mm');
    this.timeLabels = [];
}

Timeline.prototype.addGroup = function (name, id, color) {
    if(!this.groups)
        this.groups = [];

    this.groups.push({
        id: id,
        content: name,
        style: "background-color: "+color
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
            }
            else if(cStep == fixedStartStep+2){//>fixedStartStep && cStep<=fixedEndStep) {
                obj.start = undefined;
                obj.end = self.fixedProps[1].toShow;
            } else if(cStep == fixedStartStep+3) {
                obj.start  = self.fixedProps[1].toShow;
            } else if (cStep > fixedEndStep){
                var e = self.stepLabels[self.stepLabels.length-1].start;
                var s = self.timeStep(e,'minutes');

                var d = self.min.clone().add((s+1)*self.step,'minutes');
                obj.start = d;

                if(cStep == fixedStartStep+4){
                    self.stepLabels[self.stepLabels.length-1].end = obj.start;
                }
            }
        }

        if(!obj.s)
            obj.s = obj.start;

        self.stepLabels.push(obj);
    }

    console.log(self.stepLabels);
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
        var left1 = self.getLabelLeft(it1.id);
        var left2 = self.getLabelLeft(it2.id);
        var text = moment.duration(it2.toShow.clone().diff(it1.toShow,'minutes'),'minutes').format('HH:mm');

        this.displayTextLabel((left1+left2)/2, text, it1.className);
    }
};

Timeline.prototype.displayTextLabel = function (left, text, className) {
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
        if(!nItem.id)
            nItem.id = self.items.length;

        if(item.group === undefined){
            nItem.className = "pallete-color-"+Math.floor(((Math.random()*100)%5)+1);
        }

        nItem['toShow'] = item.start;
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

Timeline.prototype.draw = function (dont) {
    var that = this;
    var self = that;
    var items = new vis.DataSet(self.items);

    var options = {
        stack:true,
        timeAxis: {
            scale:'minute',
            step:self.step
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
        horizontalScroll: false,
        moveable: false,
        dataAttributes: ['id'],
        start: self.min,
        end: self.max,
        zoomable: false,
        showCurrentTime: false,
        template: function (item, element, data) {
        var html = '<div class="vis-item-content '+item.className+'"><i class="fa"></i> '+item.content+'</div>';
        var h = $(html);

        if(item.type!='background'){
            if(item.Status == "Start"){
                h.find('.fa').addClass('fa-chevron-up');
            }else{
                h.find('.fa').addClass('fa-chevron-down');
            }
        }

        return h.html();
    }
    };

    if(self.groups){
        self.groups.map(function (it) {
            self.items.push({
                type: 'background',
                start: self.min,
                end: self.max,
                group: it.id,
                content: '',
                style: it.style
            });
        })
    }

    items = self.items;
    self.timeline = new vis.Timeline(self.container, items,self.groups,options);

    setTimeout(function () {
        self.items.map(function (item) {
            if(item.toShow)
                self.showTimeLabels(item.toShow.format('HH:mm'),item);
        });

        self.showFixedText();
        self.showTimelineLabels();
    },1000);
}

var jsonData = JSON.parse($('#jsonData').html());
var container = $('.js-charts-container');
var chartsTemp = $('#chart-temp').html();
var i = 0;

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

    var sumTime = new Timeline(summary);
    var preTime = new Timeline(preop);
    var interTime = new Timeline(interop);
    var postTime = new Timeline(postop);

    var id = 0;
    var its = [];
    for(var prop in patient.summary){
        var color = "";
        if(prop == 'PatientSummary'){
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

    sumTime.setItems(its);
    preTime.setItems(getData(data.stages.Preop));
    interTime.setItems(getData(data.stages.IntraOp));
    postTime.setItems(getData(data.stages.Recovery,'Pre'));
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
    ++i;
})

function getData(arr) {
    var data = [];
    arr.map(function (it) {
        data.push({
            id: it.ObjectId,
            content: it.Name,
            Status: it.Status,
            start: moment(moment(it.TimeStamp,'YYYY-MM-DD HH:mm').format('HH:mm'),'HH:mm')
        });
    });

    if(arr.length>4)
        data[4].fixed = true;

    return data;
}