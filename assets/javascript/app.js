import { routes } from "./routes.js";

const app = {

	firstData: null,

	init() {
		this.findRoute();
	},

	findRoute() {
		const location = window.location.pathname;
		const pickedRoute = routes.find(route => route.route === location);
		this.addScript(`modules/layouts/${pickedRoute.layout}.html`);
	},

	async addScript(url, target = null) {
		await fetch(url).then(resp => resp.text()).then(data => {
			if(target === null) {
				target = "app";
			}
			if(this.firstData === null) this.firstData = target;
			this.parseResult(data, target);
		});
	},
	
	parseResult(data, target) {
		const dataResult = this.parseData(data);
		const templateData = dataResult?.querySelectorAll("div[data-template]");
		this.addData(dataResult, target);
		if(templateData?.length > 0) {
			for(let i = 0; i < templateData.length;i++) {
				const dataTemplate = templateData[i].getAttribute("data-template");
				if(dataTemplate !== null) {
					target = `${dataTemplate}`;
					this.addScript(`modules/snippets/${dataTemplate}.html`, target);
				}
			}
		} else {
			this.stripData(this.firstData);
		}
	},

	stripData(firstData) {
		const allHTML = document.querySelector(`[data-template="${firstData}"]`);
		
		console.log(allHTML);
	},

	parseData(data) {
		const parser = new DOMParser();
		let dom = parser.parseFromString(data, "text/html").getRootNode().querySelector('*[template]');
		return dom;
	},	

	addData(data, target) {
		document.querySelector(`[data-template="${target}"]`).appendChild(data);
	}
}

app.init();