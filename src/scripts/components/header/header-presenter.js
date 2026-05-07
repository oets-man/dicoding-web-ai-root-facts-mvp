export default class HeaderPresenter {
	#view;

	constructor({ view }) {
		this.#view = view;
	}

	updateStatus(message) {
		this.#view.updateStatus(message);
	}
}
