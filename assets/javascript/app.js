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
					if(dataTemplate !== "@outlet") {
						const pickedPagePath = `modules/snippets/${dataTemplate}/${dataTemplate}`;
						this.addScript(`${pickedPagePath}.html`, target);
						this.callJs(pickedPagePath);
					} else {
						const location = window.location.pathname;
						const pickedPage = routes.find(route => route.route === location);
						const pickedSnippetPath = `modules/templates/${pickedPage.page}/${pickedPage.page}`;
						this.addScript(`${pickedSnippetPath}.html`, target);
					}
				}
			}
		} else {
			this.appendData(this.firstTarget);
		}
	},

	callJs(pickedPath) {
		let scriptTag = document.createElement('script');
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