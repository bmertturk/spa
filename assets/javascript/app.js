import { routes } from "./routes.js";

const app = {

	fullData: "",
	firstTarget: "",

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
			if(this.firstTarget === "") this.firstTarget = target;
			this.parseResult(data, target);
		});
	},
	
	parseResult(data, target) {
		const templateData = this.matchMustache(data);
		this.addData(data, target);
		if(templateData?.length > 0) {
			for(let i = 0; i < templateData.length;i++) {
				const dataTemplate = this.stripData(templateData[i]);
				if(dataTemplate !== null) {
					target = `${dataTemplate}`;
					if(dataTemplate !== "outlet") {
						this.addScript(`modules/snippets/${dataTemplate}.html`, target);
					} else {
						const location = window.location.pathname;
						const pickedPage = routes.find(route => route.route === location);
						this.addScript(`modules/templates/${pickedPage.page}.html`, target);
					}
				}
			}
		} else {
			this.appendData(this.firstTarget);
		}
	},

	matchMustache(data) {
		return data.match(/\{\{*.*\}\}/gm);
	},

	stripData(data) {
		return data.replace("{{", "").replace('}}', "").trim();
	},

	replaceData(data, target) {
		const mustache = new RegExp(`{{\\s?${target}\\s?}}`);
		this.fullData = this.fullData.replace(mustache, data);
	},

	parseData(data) {
		const parser = new DOMParser();
		let dom = parser.parseFromString(data, "text/html").getRootNode();
		return dom;
	},

	addData(data, target) {
		if(target === "app") {
			this.fullData = data;
		} else {
			this.replaceData(data, target);
		}
	},

	appendData(target) {
		document.querySelector(`#${target}`).innerHTML = this.fullData;
	}
}

app.init();