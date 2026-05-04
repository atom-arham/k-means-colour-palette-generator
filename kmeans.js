const MAX_ITERATIONS = 50;

function randomBetween(min,max){
return Math.floor(
    Math.random() * (max - min) + min
);
}

function calculateMeanCentroid(data, start, end){
    const features = data[0].length;
    const diff = end - start;

    let mean = [];

    for(let i=0; i < features; i++){
        mean.push(0)
    }

    for (let i=start; i < end; i++){
        for (let j=0; j < features; j++){
            mean[j] = mean[j] + data[i][j]/ diff;
        }
    }

    return mean;
}


//naive sharding centroid

function getNaiveSharding(data,k){
    const samples = data.length;
    const step = Math.floor(samples/k);
    const centroids = [];

    for (let i=0; i < k; i++){
        const start = step * i;
        let end = step * (i+1);

        if (i+1 === k){
            end = samples;
        }
        centroids.push(calculateMeanCentroid(data,start,end));
    }
    return centroids;
}

//random centroids

function getRandomCentroids(data,k){
    const samples = data.length;
    const centroidsIndex = [];
    let index;

    while (centroidsIndex.length < k){
        index = randomBetween(0, samples);

        if (centroidsIndex.indexOf(index) === -1){
            centroidsIndex.push(index);
        }
    }
    const centroids = [];

    for (let i=0; i < centroidsIndex.length; i++){
        const centroid = [...data[centroidsIndex[i]]];
        centroids.push(centroid);
    }

    return centroids;
}


function compareCentroids(a,b){
    for (let i=0; i < a.length; i++){
        if (a[i] != b[i]){
            return false;
        }
    }
    return true;
}


function shouldStop(old_centroids, centroids, iterations){
    if (iterations > MAX_ITERATIONS){
        return true;
    }

    if (!old_centroids || !old_centroids.length){
        return false;
    }

    let same_count = true;

    for (let i=0; i < centroids.length; i++){
        if (!compareCentroids(centroids[i], old_centroids[i])){
            same_count = false;
        }
    }
    return same_count
}



// uses squared euclidean distance
function getDistance(a,b){
    const diff = [];

    for (let i=0; i < a.length; i++){
        diff.push(a[i] - b[i]);
    }
    return diff.reduce((r,e) => (r+(e*e)), 0);
}

function getLabels(data, centroids){

    const labels = {};

    for (let c=0; c < centroids.length; c++){
        labels[c] = {points: [], centroid: centroids[c],};
    }

    for (let i=0; i< data.length; i++){
        const a = data[i];
        let closest_centroid, closest_centroid_index, previous_distance;


        for (let j=0; j< centroids.length; j++){
            let centroid = centroids[j];

            if (j===0){
                closest_centroid = centroid;
                closest_centroid_index = j;
                previous_distance = getDistance(a, closest_centroid);
            } else {
                const distance = getDistance(a, centroid);
                if (distance < previous_distance){
                    previous_distance = distance;
                    closest_centroid = centroid;
                    closest_centroid_index = j;
                }
            }
        }
        labels[closest_centroid_index].points.push(a);
    }
    return labels;
}

function getPointsMean(points){
    const total_points =  points.length;
    const means = [];

    for (let i=0; i< points[0].length; i++ ){
        means.push(0);
    } 

    for (let j=0; j < points.length; j++){
        const point = points[j];

        for (let k=0; k< point.length; k++){
            const value = point[k];
            means[k] = means[k] + value/total_points;
        }
    }
    return means;
}


function recalculateCentroids(data, labels, k){
    let new_centroid;
    const new_centroid_list = [];

    for (const k in labels){
        const centroid_group = labels[k];

        if (centroid_group.points.length > 0){
            new_centroid = getPointsMean(centroid_group.points);
        } else {
            new_centroid = getRandomCentroids(data,1)[0];
        }
        new_centroid_list.push(new_centroid);
    }
    return new_centroid_list;
}




//kmeans

function kmeans(data, k, useNaiveSharding = true){
    if (data.length && data[0].length && data.length > k){
        let iterations = 0;
        let old_centroids, labels, centroids;

        if (useNaiveSharding){
            centroids = getNaiveSharding(data,k);
        } else {
            centroids = getRandomCentroids(data,k);
        }

        while (!shouldStop(old_centroids, centroids, iterations)){
            old_centroids = [...centroids];
            iterations++;
            
            labels = getLabels(data, centroids);
            centroids = recalculateCentroids(data,labels,k);
        }

        const clusters = [];
        for (let i=0; i<k;i++){
            clusters.push(labels[i]);
        }
        
        const results = {
            clusters: clusters,
            centroids: centroids,
            iterations: iterations,
            converged: iterations <= MAX_ITERATIONS,
        };
        return results;
    } else {
        throw new Error('Invalid Dataset')
    }
}

