
var simulationStep = function(entity, perceptions, canvas){

    if (Math.random() > 0.5) {
        entity.rotate(10);
    } else {
        entity.rotate(-10);
    }
    entity.move(1);

};
