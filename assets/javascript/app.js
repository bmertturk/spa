import { routes } from "./routes.js";

const app = {

	fullData: "",
	firstTarget: "",
	allComponents: [],

	init() {
		this.findRoute();
		this.eventListener();
	},

	findRoute() {
		const location = window.location.pathname;
		const pickedRoute = routes.find(route => route.route === location);
		this.addScript(`modules/layouts/${pickedRoute.layout}.html`);
	},

	async addScript(url, target = null) {
		await fetch(url).then(resp => resp.text()).then(data => {
			if (target === null) {
				target = "app";
			}
			if (this.firstTarget === "") this.firstTarget = target;
			this.parseResult(data, target);
		});
	},

	parseResult(data, target) {
		const templateData = this.matchMustache(data);
		this.addData(data, target);
		if (templateData?.length > 0) {
			for (let i = 0; i < templateData.length; i++) {
				const dataTemplate = this.stripData(templateData[i]);
				if (dataTemplate !== null) {
					target = `${dataTemplate}`;
					let pickedPath;
					let pickedName;
					if (dataTemplate !== "@outlet") {
						pickedName = dataTemplate;
						pickedPath = `modules/snippets/${dataTemplate}/${dataTemplate}`;
					} else {
						const location = window.location.pathname;
						const pickedPage = routes.find(route => route.route === location);
						pickedPath = `modules/templates/${pickedPage.page}/${pickedPage.page}`;
						pickedName = pickedPage.page;
					}
					this.addScript(`${pickedPath}.html`, target);
					if(this.allComponents.findIndex(component => component.name === pickedName) === -1) {
						this.allComponents.push({
							name: pickedName,
							path: pickedPath,
							scriptElement: null
						});
						this.callJs(pickedPath);
					}
				}
			}
		} else {
			this.appendData(this.firstTarget);
		}
	},

	callJs(pickedPath) {
		const componentIndex = this.allComponents.findIndex(component => component.path === pickedPath);
		let scriptTag = this.allComponents[componentIndex].scriptElement;
		if(scriptTag !== null) return;
		scriptTag = document.createElement('script');
		scriptTag.src = `${pickedPath}.js`;
		document.body.appendChild(scriptTag);
	},

	matchMustache(data) {
		return data.match(/{% include?'*.*'?%}/gm);
	},

	stripData(data) {
		return data.replace("{% include", "").replace('%}', "").trim().replaceAll("'", "");
	},

	replaceData(data, target) {
		const mustache = new RegExp(`{% include\\s?\'${target}\'\\s?%}`);
		this.fullData = this.fullData.replace(mustache, data);
	},

	parseData(data) {
		const parser = new DOMParser();
		let dom = parser.parseFromString(data, "text/html").getRootNode();
		return dom;
	},

	addData(data, target) {
		if (target === "app") {
			this.fullData = data;
		} else {
			this.replaceData(data, target);
		}
	},

	appendData(target) {
		document.querySelector(`#${target}`).innerHTML = this.fullData;
	},

	handleLink(e) {
		const anchor = e.target.closest('a');
		if (anchor !== null) {
			history.pushState({}, anchor.href, anchor.href);
			this.fullData = "";
			this.findRoute();
		}
	},

	eventListener() {
		document.addEventListener('click', e => {
			e.preventDefault();
			this.handleLink(e);
		});
		window.onpopstate = (e) => {
			this.fullData = "";
			this.findRoute();
		}
	}

}

app.init();