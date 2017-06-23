'use strict';
var Timeline = function (container) {
    this.container = container;
    this.items = [];
    this.drawCalled = false;
    this.groups = undefined;
    this.fixedProps = {};
    this.step = 60;
    this.stepLabels = [];
    this.min = moment('00:00','HH:mm');
    this.max = moment('23:59','HH:mm');
    this.timeLabels = [];
}

Timeline.prototype.addGroup = function (name, id, color) {
    var order = {
        'Patient': 0,
        'Nursing': 1,
        'Surgeon': 2,
        '': 3,
        'Anesthesia': 4,
        'EMS': 5
    };
    if(!this.groups)
        this.groups = [];

    this.groups.push({
        id: id,
        content: name,
        order: order[name],
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
    var steps = Math.ceil(self.max.diff(startDate,'minutes')/self.step)+1;
    var modifier = 0;
    for(var x=0;x<=steps;++x) {
        var date = startDate.clone().add(x*self.step,'minutes');
        var sDate = date.clone();
        var obj  = {
            start: sDate,
            actual: date.clone(),
            end: sDate.clone().add(self.step,'minutes')
        };

        if(self.fixedProps && self.fixedProps.length==2) {
            var fixedStartStep = self.timeStep(self.fixedProps[0].start, 'minutes');
            var fixedEndStep = self.timeStep(self.fixedProps[1].start, 'minutes');
            var cStep = self.timeStep(date, 'minutes');
            var mins = self.duration(self.fixedProps[1].toShow, 'minutes');
            var minsStep = Math.ceil(mins / self.step);

            if (minsStep == mins / self.step) {
                minsStep++;
            }

            var pre = self.fixedProps[0].toShow.clone().endOf('hour').add(1, 'minute');
            var toSet = self.fixedProps[1].toShow.clone().endOf('hour').add(1, 'minute');
            if (pre.diff(toSet, 'minutes') < -120){
                 if (cStep == fixedStartStep + 1 + modifier) { //Before fixed
                     obj.s = obj.start;
                     obj.start = null;
                //     var pre = self.stepLabels[self.stepLabels.length - 1];
                //     obj.start = self.fixedProps[0].toShow;
                //     if (pre.start.clone().diff(obj.start, 'second') == 0) {
                //         modifier = -1;
                //         x--;
                //         pre.end = obj.start.clone().add(2, 'second');
                //         obj = null;
                //     } else {
                //         if (self.stepLabels.length > 0) {
                //             pre.end = obj.start.clone().subtract(2, 'second');
                //         }
                //
                //         obj.end = obj.start;
                //     }
                //  } else if (cStep == fixedStartStep + 2 + modifier) {
                //     obj.start = null;
                //     obj.s = self.fixedProps[1].toShow;
                //     obj.end = self.fixedProps[1].toShow;
                //     obj.s = null;
                //     obj.end = null;
                } else
                    if (cStep == fixedStartStep + 2 + modifier) {
                    var pre = self.fixedProps[0].toShow.clone().endOf('hour').add(1, 'minute');
                    var toSet = self.fixedProps[1].toShow.clone().endOf('hour').add(1, 'minute');
                    var danger = false;

                    if (pre.diff(toSet, 'minutes') == 0) {
                        obj.start = self.fixedProps[0].toShow.clone().endOf('hour').add(1, 'minute');
                    } else {
                        obj.start = self.fixedProps[1].toShow.clone().startOf('hour');
                    }
                    obj.end = obj.start.clone().add(self.step, 'minute');

                    //if(danger){
                    var t = obj.start.clone();
                    var pre = self.stepLabels[self.stepLabels.length - 1];

                    pre.end = t.clone();
                    var tenPercent = pre.end.clone().diff(self.fixedProps[1].toShow, 'minutes');
                    //when surgury end == HH:00
                    if (tenPercent == 0) {
                        pre.s = self.fixedProps[1].toShow.clone().subtract(1, 'second');
                        pre.end = self.fixedProps[1].toShow.clone();
                    } else {
                        pre.s = pre.end.clone().subtract(tenPercent * 10, 'minute');
                    }
                    //}
                }
                else if (cStep > fixedStartStep + 2 + modifier) {
                    obj.start = self.stepLabels[self.stepLabels.length - 1].end.clone();
                    obj.end = obj.start.clone().add(self.step, 'minute');
                }
            }
        }


        if(obj && !obj.s)
            obj.s = obj.start;

        if(obj)
            self.stepLabels.push(obj);
    }
}

Timeline.prototype.showTimeLabels = function (text, item) {
    // var self = this;
    // this.displayTextLabel(self.getLabelLeft(item.id),text,item.className);
};

Timeline.prototype.showFixedText = function () {
    if(this.fixedProps && this.fixedProps.length==2){
        var self = this;
        var it1 = this.fixedProps[0];
        var it2 = this.fixedProps[1];
        var dimens1 = self.dimens(it1.id);
        var dimens2 = self.dimens(it2.id);
        var text = moment.duration(it2.toShow.clone().diff(it1.toShow,'minutes'),'minutes').format('HH:mm');

        var toAdd = $("<div></div>");
        toAdd.css('left',(dimens1.right+10)+'px');
        toAdd.css('width',(dimens2.left - (dimens1.right+10))+'px');
        toAdd.css('height','1px');
        toAdd.css('z-index','3');
        if(it1.group!==undefined)
            toAdd.css('border','2px #000000 dashed');
        else
            toAdd.css('border','2px '+it1.color + ' dashed');
        toAdd.css('position','absolute');
        toAdd.css('top',((dimens1.top+dimens1.bottom)/2)+'px');
        toAdd.addClass('tm-time-label');

        dimens1.parent.append(toAdd);
    }
};

Timeline.prototype.clearLabels = function () {
    $(this.container).find('.tm-time-label').remove();
    this.timeLabels = {};
}

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
    left.dimens.parent.append(template);
}

Timeline.prototype.getLabelLeft = function (itemId) {
    var dimens = this.dimens(itemId);
    var center = (dimens.left+dimens.right)/2;
    return {dimes: dimens,val : center-20};
}

Timeline.prototype.dimens = function (itemId) {
    var it = $(this.container).find('[data-id='+itemId+']');
    var left=  parseInt(it.css('left'));
    //left += parseInt($(this.container).find('[data-id='+itemId+']').parents('.vis-panel').css('left'));
    var width = it.width();
    var right = left+width;
    var top = parseInt(it.css('top'));
    var height = it.height();
    var bottom = top+height;


    return {
        parent: it.parent(),
        left: left,
        right: right,
        top: top,
        bottom: bottom,
        width: width,
        height: height
    };
}

Timeline.prototype.setItems = function (items) {
    var self = this;
    this.items = [];
    var insicionFound = false;


    items.map(function (item) {
        var nItem = {};
        for(var prop in item){
            nItem[prop] = item[prop];
        }
        //if(!nItem.id)
        nItem.id = self.items.length;

        if(item.color && item.group === undefined)  //Not summary
            nItem.style = "background-color: "+item.color;

        if(item.parent){
            if(!nItem.className)
                nItem.className = '';

            nItem.className += ' ' + item.parent;
        }

        nItem['toShow'] = item.start;

        if(item.timestamp){
            nItem.title = "<div><b>Updated By</b>: "+item.updatedBy+"<div>";
            nItem.title += "<div><b>Timestamp</b>: "+item.timestamp+"<div>";
        }

        if(self.fixedProps && self.fixedProps.length==1) {
            nItem.group = 122;
            self.fixedProps.push(nItem);    //Next to fixed one.
        }

        if(!insicionFound && item.fixed){
            insicionFound = true;
            nItem.group = 122;
            self.fixedProps = [nItem];
        }

        if(nItem.group===undefined)
            nItem.group = 111;
        self.items.push(nItem);
    });



};

Timeline.prototype.resolveScaledTime = function (time) {
    var self = this;
    var toRet = time;
    var start = null;
    var pre = null;

    var log = false;
    if(time.format('HH:mm') == '16:50')
        log = true;

    self.stepLabels.map(function (stepLabel) {
        var diff = 0;
        var diff2 = 0;

        if(stepLabel.s && stepLabel.end){
            diff = time.clone().diff(stepLabel.s, 'seconds');
            diff2 = time.clone().diff(stepLabel.end, 'seconds');



            if(diff>=0 && diff2 <= 0){
                start = stepLabel;
            }
        }
    });

    if(start){
        var len = start.end.clone().diff(start.s,'seconds');
        var scale = len/(self.step*60);
        var d = time.clone().diff(start.s,'seconds');
        toRet = start.actual.clone().add(d/scale,'seconds');
    }
    return toRet;
}

Timeline.prototype.trim = function () {
    var minIndex = 1232;
    var maxIndex = -1;
    var min = moment('23:59','HH:mm');
    var max = moment('00:00','HH:mm');
    this.items.map(function (item) {
        if(item.toShow.clone().diff(min,'minutes')<0){
            min = item.toShow.clone();
        }

        if(item.toShow.clone().diff(max,'minutes')>0){
            max = item.toShow.clone();
        }
    })

    min = min.startOf('hour').clone().add('-1','hour');
    max = max.endOf('hour').add(1,'minute').add('1','hour');

    for(var x=0;x<this.stepLabels.length;++x){
        var it = this.stepLabels[x];
        if(it.s){
            var diff = it.s.clone().diff(min,'minutes');
            var diff2 = it.s.clone().diff(max,'minutes');
            if(diff>=0 && diff2<=0){
                if(x<minIndex){
                    minIndex = x;
                }

                if(x>maxIndex){
                    maxIndex = x;
                }
            }
        }
    }

    this.stepLabels = this.stepLabels.slice(minIndex,maxIndex+1);
    if(this.stepLabels.length>0){
        this.min = this.stepLabels[0].actual;
        this.max = this.stepLabels[this.stepLabels.length-1].actual;
    }
}

Timeline.prototype.prepare = function () {
    var self = this;
    var _this = this;
    self.trim();

    this.items.map(function (item) {
        item.start = self.resolveScaledTime(item.start);
    });

    if(!_this.groups || _this.groups.length==0){
        _this.addGroup('',122);
        _this.addGroup('',111);
    }else{
        _this.addGroup('',122,_this.fixedProps[0].color);
    }
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
    var insIn = container.parents('.js-chart-section').find('.js-labels-cont');



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
        Name: "OR #",
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

    var a = jsonData.roles.slice();
    for(var x=toAdd.length-1;x>=0;--x)
        a.unshift(toAdd[x]);

    a.map(function (it) {
        var elem = insIn.find('[data-name="'+it.Name+'"]');
        var found = elem.length>0;
        var toAdd = elem;
        if(!found){
            toAdd = $(temp);
        }

        if(it.Value!=""){
            toAdd.find('.js-name').text(it.Name);
            toAdd.find('.js-value').text(it.Value);
        }

        if(!found)
            insIn.find('.js-labels').append(toAdd);
    })
}

function getData(arr, jsonData) {
    var data = [];
    console.log(arr);
    if(arr){
        arr.map(function (it) {
            data.push({
                id: it.ObjectId,
                content: it.Name,
                parent: it.Parent,
                Status: it.Status,
                timestamp: it.TimeStamp,
                updatedBy: it.UpdateBy,
                fixed: it.SqueezeAfter,
                color: jsonData.Palette[it.Group],
                start: moment(moment(it.TimeStamp,'YYYY-MM-DD HH:mm').format('HH:mm'),'HH:mm')
            });
        });
    }

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
        $(this).addClass('hidden');
        $(this).parent().find('.js-hide-detail').removeClass('hidden');
    });

    $(document).on('click','.js-hide-detail',function () {
        var val = $(this).attr('data-val');
        var parent = $('.js-patient-chart');
        parent.find('[data-show]').each(function () {
            if($(this).attr('data-show').indexOf(val)!=-1){
                $(this).addClass('hidden');
                $(this).find('.js-vs-chart').data('tm').draw();
            }
        })

        $(this).addClass('hidden');
        $(this).parent().find('.js-show-detail').removeClass('hidden');
    });

    $(document).on('click','.js-print-page',function () {
        var ready = 0;
        var rendered = 0;
        var total = $('.js-chart-container').length;
        $('.js-canvases').html('');
        alert('Please wait for printing to be ready.')
        var toDel = [];
        $('.js-chart-container').each(function () {
            var e = $(this);
            (function () {
                var ee = e;
                if(ee.hasClass('hidden')){
                    ready++;
                    return;
                }
                ee.addClass('capture');

                html2canvas(ee[0],{
                    onrendered: function (canvas) {
                        (function(){
                            var ind = rendered;
                            var img = $("<img />");
                            img.css('width', '100%');
                            img.css('height', '100%');
                            img.attr('data-i', ind);
                            $('.js-canvases').append(img);
                            rendered++;
                            if (rendered != total) {
                                $('.js-canvases').append("<div class='print-page-break'></div>");
                            }

                            UploadImage(canvas.toDataURL(), function (data) {
                                var img = $('img[data-i=' + ind + ']');
                                img.one('load',function () {
                                    ready++;
                                    toDel.push(data.substring(data.lastIndexOf('/')+1));
                                    ee.removeClass('capture');
                                    if (ready == total) {
                                        setTimeout(function () {
                                            toDel.map(function (it) {
                                                DeletePrint(it,function () {});
                                            });
                                            window.print();
                                        }, 2000);
                                    }
                                }).attr('src', data)
                                .each(function() {
                                    if(this.complete) $(this).trigger('load');
                                });
                            });
                        }) ();
                    }
                });
            })();
        });

    })


    var jsonData = JSON.parse($('#hdnJsonReport').val());
    var container = $('.js-charts-container');
    var chartsTemp = $('#chart-temp').html();
    var legends = $('#legends-temp').html();
    var labels = $('#labels-html').html();

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
        console.log(data);
        var toIns = $(chartsTemp);
        toIns.attr('data-chart-id',i);
        container.append(toIns);


        var chartsContainer = container.find('[data-chart-id='+i+']');

        var preop = chartsContainer.find('.js-preop')[0];
        var interop = chartsContainer.find('.js-interop')[0];
        var postop = chartsContainer.find('.js-postop')[0];
        var summary = chartsContainer.find('.js-summary')[0];
        $(preop).parents('.js-chart-container').find('.js-legends-container').append(legends);
        $(postop).parents('.js-chart-container').find('.js-legends-container').append(legends);
        $(interop).parents('.js-chart-container').find('.js-legends-container').append(legends);
        $(summary).parents('.js-chart-container').find('.js-legends-container').append(legends);
        $(preop).parents('.js-chart-container').find('.js-labels-container').append(labels);
        $(postop).parents('.js-chart-container').find('.js-labels-container').append(labels);
        $(interop).parents('.js-chart-container').find('.js-labels-container').append(labels);
        $(summary).parents('.js-chart-container').find('.js-labels-container').append(labels);

        var sumTime = new Timeline(summary);
        var preTime = new Timeline(preop);
        var interTime = new Timeline(interop);
        var postTime = new Timeline(postop);

        arr.push(sumTime);
        arr.push(preTime);
        arr.push(interTime);
        arr.push(postTime);

        var sumIds = {};
        var its = [];
        var id = 0;
        patient.stageupdates.map(function (item) {
            if(sumIds[item.Group] === undefined){
                sumIds[item.Group] = id;
                sumTime.addGroup(item.Group,id,jsonData.Palette[item.Group]);
                id++;
            }

            its.push({
                content: item.Name,
                color: jsonData.Palette[item.Group],
                Status: item.Status,
                fixed: item.SqueezeAfter,
                group: sumIds[item.Group],
                start: moment(moment(item.TimeStamp,'YYYY-MM-DD HH:mm').format('HH:mm'),'HH:mm')
            })
        });

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
        its = getData(data.stages.IntraOp,jsonData);
        its.unshift({
            content: "Scheduled Start Time",
            Status: "Start",
            className: 'special-box',
            start: moment(moment(data.SchStartTime,'MM/DD/YYYY hh:mm:ss A').format('HH:mm'),'HH:mm')
        });

        its.unshift({
            content: "Scheduled End Time",
            Status: "End",
            className: 'special-box',
            start: moment(moment(data.SchEndTime,'MM/DD/YYYY hh:mm:ss A').format('HH:mm'),'HH:mm')
        });

        preTime.setItems(getData(data.stages.PreOp,jsonData));
        interTime.setItems(its);
        postTime.setItems(getData(data.stages.PostOp,jsonData));
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
