#Nomie Event Library

**Consists of the Following Object** - EventFactory - responsible for generating events and list of events. - Event - generic Event object - Tick - Extends Event - Note - Extends Event

##EventFactory The event factory is responsible for generating new events and getting lists of events

```
var factory = new EventFactory();
```

###Query events with Filter();

```
factory.filter()
    .limit(1000)
    .startAt(moment().subtract(3, 'months').toDate().getTime())
    .parent('trackerId')
    .getTicks(function(err, callback) {

    })
```
