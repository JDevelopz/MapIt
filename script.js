'use strict';

// prettier-ignore

// const 
///////////////////////////////////////////////////

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class Workout {
    date = new Date(); // get current date.
    id = (Date.now() + '').slice(-10);// Normally better to use a libary for an unique id. 
    clicks = 0;

    constructor(coords, distance, duration) {
        this.coords = coords; // coords on click [lat, lng]
        this.distance = distance; // in km
        this.duration = duration;// in min
    }

    _setDescription() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }

    click() {
        this.clicks++;
        console.log(this.clicks);
    }
}

class Running extends Workout {
    type = 'running';
    icon = '🏃‍♂️';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;

        this.calcPace();
        this._setDescription();
    }

    calcPace() {
        //min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling';
    icon = '🚴‍♀️';

    constructor(coords, distance, duration, elevation) {
        super(coords, distance, duration);
        this.elevation = elevation;

        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}
//////////////////////
// //test
// const run1 = new Running([39, -12], 5.2, 23, 178);
// const cycling1 = new Cycling([39, -12], 25, 20, 5);

class App {

    #map;
    #mapEvent;
    #workouts = [];

    constructor() {
        // Get user's position 
        this._getPosition();

        // Get data from local storage
        this._getLocalStorage();

        // Event handlers
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationForm);
        containerWorkouts.addEventListener('click', this._markerToWorkout.bind(this));
    }

    _getPosition() {
        //Geolocation API 
        ///////////////////////////////////////////////////
        if(navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),
            function () {
                alert('Could not get your position')
            });
        }

    _loadMap(position) {
            const {
                latitude
            } = position.coords;
            const {
                longitude
            } = position.coords;
            // console.log(`https://www.google.co.id/maps/@${latitude}.${longitude}?hl=id`);

            this.#map = L.map('map').setView([latitude, longitude], 13);

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(this.#map);

            const marker = L.marker([latitude, longitude]).addTo(this.#map);

            this.#map.on('click', this._showForm.bind(this));

            // Render the local Storage on the map. 
            this.#workouts.forEach(workout => {
                this._renderWorkoutMarker(workout);
            });
        }

    _showForm(mapE) {
        // add a map marker with click. 
            this.#mapEvent = mapE;
            // Render the form element to showcase the activities
            // form.style.display = 'grid';
            form.classList.remove('hidden'); // remove hidden class from form
            inputDistance.focus(); // set focus on km for UX
    }

    _hideForm() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
        // form.style.display = 'none';
        form.classList.add('hidden');
    }

    _toggleElevationForm() {
    // Add event listener to listen of the use has running or cycling. 
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);
        const {lat, lng} = this.#mapEvent.latlng;
        let workout;

        e.preventDefault();
        // get data from form 
        const type = inputType.value;
        // console.log(type);
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;

        // // check if data is valid 
        // if (!validInputs(distance, duration, cadence))
        // return alert('Input have to have positive numbers!')

        // if workout is running, create running object. 
        if ( type === 'running') {
            const cadence = +inputCadence.value;

            if (!validInputs(distance, duration, cadence) || !allPositive(distance, duration))
            alert('Input have to have positive numbers!');
            
            workout = new Running([lat, lng], distance, duration, cadence);

        }
        // if workout is cycling, create cycling object. 
        if ( type === 'cycling') {
            const elevation = +inputElevation.value;

            if (!validInputs(distance, duration, elevation) || !allPositive(distance, duration))
             alert('Input have to have positive numbers!')
             
             workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        // Add new object to workout array. 
        this.#workouts.push(workout);

        // render workout on map as marker
        this._renderWorkoutMarker(workout);

        // render workout on the list
        this._renderWorkout(workout);

        // Clear input fields 
        this._hideForm();

        // store data to local storage. 
        this._setLocalStorage();
    }

    _renderWorkoutMarker(workout) {
        const today = new Date();

        L.marker(workout.coords) // get coordinates from the created array.
            .addTo(this.#map) // add to the current map.
            .bindPopup( // L.popup giving the popup a styling.
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
            )
            .setPopupContent(`${workout.icon}${workout.description}`)
            .openPopup();
        }

        _renderWorkout(workout) {
            const html = `
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.icon}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.type === 'running' ? workout.pace.toFixed(1) : workout.speed.toFixed(1)}</span>
            <span class="workout__unit">${workout.type === 'running' ? 'min/km' : 'km/h'}</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🦶🏼' : '⛰'}</span>
            <span class="workout__value">${workout.type === 'running' ? workout.cadence : workout.elevation}</span>
            <span class="workout__unit">${workout.type === 'running' ? 'spm' : 'm'}</span>
          </div>
        </li>`;

        containerWorkouts.insertAdjacentHTML('beforeend', html);

        }

    _markerToWorkout(e) {
            const workoutEl = e.target.closest('.workout');
            // console.log(workoutEl);
            if (!workoutEl) return;

            const workout = this.#workouts.find(
                work => work.id === workoutEl.dataset.id);
            console.log(workout);

            this.#map.setView(workout.coords, 15, {
                animate:true,
                pan: {
                    duration: 1,
                }
            });
        // workout.click();
    }

    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        // console.log(data);

        if(!data) return 

        this.#workouts = data;

        // render the workouts on the map. 
        this.#workouts.forEach(workout => {
            this._renderWorkout(workout);
        });
        // --> We render at _loadMap because the map need to be loaded first. 
    }

    reset() {
        localStorage.removeItem('workouts');
        location.reload();
    }
}

const app = new App();
