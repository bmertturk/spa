import { routes } from "./routes.js";

const app = {

	fullData: "",
	firstTarget: "",
	allComponents: [],
	lastTarget: "",

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
		if (target === null) {
			target = "app";
		}
		if (this.firstTarget === "") this.firstTarget = target;
		// Bittiği yeri bulamıyorum.
		document.querySelector(`#${this.firstTarget}`).classList.add('loading');
		await fetch(url).then(resp => resp.text()).then(data => {
			this.parseResult(data, target);
		});
	},

	async parseResult(data, target) {
		const templateData = this.matchMustache(data);
		this.addData(data, target);
		if (templateData?.length > 0) {
			for(let i in templateData) {
				console.log('loop');
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
				if(Number(i)+1 === templateData.length) {
					// Bittiği yer burası gibi gözükse de burası değil
					console.log('son');
					document.querySelector(`#${this.firstTarget}`).classList.remove('loading');
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
		let scriptWrapper = document.createElement('div');
		scriptWrapper.id = "script-wrapper";
		scriptTag = document.createElement('script');
		scriptTag.src = `${pickedPath}.js`;
		if(!document.querySelector('#script-wrapper')) {
			document.body.appendChild(scriptWrapper);
		}
		document.querySelector('#script-wrapper').appendChild(scriptTag);
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