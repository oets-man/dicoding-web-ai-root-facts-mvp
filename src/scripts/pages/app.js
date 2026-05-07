import HeaderPresenter from '../components/header/header-presenter.js';
import HeaderView from '../components/header/header-view.js';
import HomePage from './home/home-page.js';

class App {
	#container = null;
	#headerPresenter = null;

	constructor({ container }) {
		this.#container = container;
	}

	async renderPage() {
		const headerView = new HeaderView();
		const headerHTML = await headerView.render();
		this.#headerPresenter = new HeaderPresenter({ view: headerView });

		const page = new HomePage({ headerPresenter: this.#headerPresenter });
		const pageHTML = await page.render();

		this.#container.innerHTML = `${headerHTML}${pageHTML}`;
		await page.afterRender();
	}
}

export default App;
