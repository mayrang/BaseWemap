import { useEffect } from "react";
import { Button } from "antd";
import AfterInstallation from "components/AfterInstallation";
import OverlayLoadingCustom from "components/Common/OverlayLoadingCustom";
import MainLayout from "layouts/MainLayout";
import { useCallback, useState } from "react";
import { setDefaultOptions, loadModules } from "esri-loader";
import "./HomePage.css";

const HomePage = () => {
  const init = () => {
    setDefaultOptions({ version: "4.26" });
    loadModules([
      "esri/views/MapView",
      "esri/WebMap",
      "esri/Map",
      "esri/Basemap",
      "esri/layers/WebTileLayer",
      "esri/layers/TileLayer",
      "esri/layers/BaseElevationLayer",
      "esri/layers/ElevationLayer",
      "esri/layers/VectorTileLayer",
      "esri/widgets/BasemapToggle",
      "esri/widgets/Home",
      "esri/widgets/Compass",
      "esri/widgets/ScaleBar",
      "esri/widgets/Expand",
      "esri/widgets/LayerList",
      "esri/widgets/Legend",
      "esri/Graphic",
      "esri/layers/FeatureLayer",
      "esri/layers/GraphicsLayer",
      "esri/layers/GeoJSONLayer",
    ])
      .then(
        ([
          MapView,
          WebMap,
          Map,
          Basemap,
          WebTileLayer,
          TileLayer,
          BaseElevationLayer,
          ElevationLayer,
          VectorTileLayer,
          BasemapToggle,
          Home,
          Compass,
          ScaleBar,
          Expand,
          LayerList,
          Legend,
          Graphic,
          FeatureLayer,
          GraphicsLayer,
          GeoJSONLayer,
        ]) => {
          const initialViewParams = {
            zoom: 5,
            center: [112.41937701128425, 16.188401209223233],
            // container: this.$el, // use same container for views
            container: "viewDiv", // use same container for views
            ui: {
              components: ["attribution"],
            },
            popup: {
              dockEnabled: true,
              dockOptions: {
                // Ignore the default sizes that trigger responsive docking
                breakpoint: false,
              },
              visibleElements: {
                featureNavigation: false,
              },
            },
            highlightOptions: {
              // color: [255, 255, 0, 1],
              fillOpacity: 0,
            },
          };
          const worldImagery = new VectorTileLayer({
            url: "https://vector.wemap.asia/styles/osm-bright/style.json",
            // copyright: 'FIMO JSC',
            attributes: "FIMO JSC",
          });
          const adminSea = new TileLayer({
            url: "https://tiles.arcgis.com/tiles/EaQ3hSM51DBnlwMq/arcgis/rest/services/VietnamLabels/MapServer",
          });
          const googleBaseMap = new WebTileLayer({
            // urlTemplate: 'https://mts{subDomain}.google.com/vt?lyrs=y&x={col}&y={row}&z={level}&s=Gal&apistyle=s.e%3Ag.f',
            urlTemplate:
              "https://mts{subDomain}.google.com/vt?lyrs=s&x={col}&y={row}&z={level}",
            subDomains: ["0", "1", "2", "3"],
            // copyright: 'FIMO JSC',
            opacity: 1,
          });
          const satellite = new Basemap({
            baseLayers: [adminSea],
            title: "Satellite",
            id: "Satellite",
            thumbnailUrl: "/images/satellite.jpg",
          });
          const WeMap = new Basemap({
            // baseLayers: [tileLayer, adminBasemap, adminSea],
            baseLayers: [worldImagery, adminSea],
            title: "WeMap",
            id: "WeMap",
            thumbnailUrl: "/images/topo.jpg",
          });
          const ExaggeratedElevationLayer = BaseElevationLayer.createSubclass({
            properties: {
              exaggeration: 2,
            },
            load() {
              this._elevation = new ElevationLayer({
                url: "//elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer",
              });
              this.addResolvingPromise(this._elevation.load());
            },
            // Fetches the tile(s) visible in the view
            fetchTile(level, row, col, options) {
              return this._elevation
                .fetchTile(level, row, col, options)
                .then((data) => {
                  const { exaggeration } = this;

                  for (let i = 0; i < data.values.length; i++) {
                    data.values[i] = data.values[i] * exaggeration;
                  }
                  return data;
                });
            },
          });

          const map2d = new Map({
            basemap: WeMap, // Basemap layer service
            // ground: 'world-elevation' // Elevation service
            ground: {
              layers: [new ExaggeratedElevationLayer()],
            },
            popup: {
              dockEnabled: true,
              dockOptions: {
                buttonEnabled: false,
                breakpoint: false,
              },
            },
          });
          const mapView = new MapView(initialViewParams);
          mapView.map = map2d;
          let IPGeoJsonLayer = null;
          const pictureSymbol = (url) => {
            return {
              type: "picture-marker", // For PictureMarkerSymbol the type is always "picture-marker".
              url,
              width: 25,
              height: 25,
            };
          };
          const appIpMapLayer = async () => {
            const populationChange = (feature) => {
              const attributes = feature.graphic.attributes;
              const div = document.createElement("div");
              div.innerHTML = `<table class="esri-widget__table">
        <tr><td align="left">${t("popup.ip.name")}</td><td>${
          attributes[`name_${locale.value === "ja" ? "jp" : locale.value}`]
            ? attributes[`name_${locale.value === "ja" ? "jp" : locale.value}`]
            : attributes.name_vi
        }</td></tr>
        <tr><td align="left">${t("ip.address.province")}</td><td>${
          attributes.province
        }</td></tr>
        <tr><td align="left">${t("ip.address.district")}</td><td>${
          attributes.district
        }</td></tr>
        <tr><td align="left">${t("ip.address.ward")}</td><td>${attributes.ward}</td></tr>
        <tr><td align="left">${t("popup.ip.founded_year")}</td><td>${attributes.year}</td></tr>
        <tr><td align="left">${t("popup.ip.lifetime")}</td><td>${
          attributes.year ? 50 - (2023 - attributes.year) : 50
        }</td></tr>
        <tr><td align="left">${t("popup.ip.investor")}</td><td>${
          attributes.investor || ""
        }</td></tr>
        </table>`;
              return div;
            };

            const IPGeoJSONTemplate = {
              title: `{name_vi}`,
              outFields: ["*"],
              actions: [
                {
                  title: t("map.popup.actionViewDetail"),
                  id: "click-view-detail",
                  className: "esri-icon-documentation",
                },
              ],
              content: populationChange,
            };
            const ipStatisticLayer = new FeatureLayer({
              url: "https://gis.fimo.com.vn/arcgis/rest/services/Pivasia/VNtinh_ip_statistic/MapServer/0",
              title: "ipStatistics",
              visible: true,
              renderer: {
                type: "unique-value",
                field: "type",
                legendOptions: {
                  // title: self.t('map.service.park.title')
                  title: " ",
                },
                uniqueValueInfos: [
                  {
                    value: "Khu công nghiệp",
                    label: t("map.widget.legen.park"),
                    symbol: pictureSymbol("/kcn.png"),
                  },
                ],
              },
              // labelsVisible: false,
              // outFields: ['ip'],
              labelingInfo: {
                labelExpressionInfo: { expression: "$feature.ip" },
                symbol: {
                  type: "text", // autocasts as new TextSymbol()
                  color: "white",
                  haloSize: 1,
                  font: {
                    size: "16px",
                  },
                  haloColor: "black",
                },
                labelPlacement: "above-center",
                minScale: 2500000,
              },
              maxScale: 750000, // Show hide cluster
            });
            const getCCNGEOJSON = async () => {
              const res = await customFetch("ip", {
                params: {
                  format: "geojson",
                  fields:
                    "objectid,name_vi,name_en,name_jp,type,province,district,ward,street,addr_numbe,year,ip_lifetime,investor,flycam,total_landarea,leased_landarea,rental_price,airport_id,seaport_id,riverport_id,airport_distance,seaport_distance,riverport_distance,shape_geojson,web_3d",
                  extra: "airport,seaport,riverport,ip_promotion",
                  limit: 2000,
                  type: "Khu công nghiệp",
                },
              });
              return res.data;
            };
            const IPGeojson = await getCCNGEOJSON();
            const geoJSONtoBlob = (geojson) => {
              // create a new blob from geojson FeatureCollection
              const IPBlob = new Blob([JSON.stringify(geojson)], {
                type: "application/json",
              });
              // URL references to the blob
              return URL.createObjectURL(IPBlob);
            };
            const IP_URL = geoJSONtoBlob(IPGeojson);
            IPGeoJsonLayer = new GeoJSONLayer({
              url: IP_URL,
              id: "ip",
              title: "map.service.park.title",
              copyright: "PIVASIA",
              popupTemplate: IPGeoJSONTemplate,
              // popupTemplate: self.IPGeoJSONTemplate,
              orderBy: {
                field: "type",
              },
              minScale: 750001, // Show hide cluster
              renderer: {
                type: "unique-value",
                field: "type",
                legendOptions: {
                  // title: self.t('map.service.park.title')
                  title: " ",
                },
                uniqueValueInfos: [
                  {
                    value: "Khu công nghiệp",
                    label: "Khu công nghiệp",
                    symbol: pictureSymbol("/kcn.png"),
                  },
                ],
              },
            });
            map2d.add(ipStatisticLayer);
            map2d.add(IPGeoJsonLayer);
          };

          mapView.popup.on("trigger-action", (event) => {
            if (event.action.id === "click-view-detail") {
              router.push(localePath(`/industrial-park/ip.${ipId.value}`));
            }
          });
          mapView.on("click", async (event) => {
            const hitTest = await mapView.hitTest(event, {
              include: IPGeoJsonLayer,
            });

            if (hitTest) {
              if (hitTest.results.length) {
                const attributes = hitTest.results[0].graphic.attributes;
                ipId.value = Number(attributes.objectid);
              }
            }
          });

          const baseMapToggle = () => {
            const toggle = new BasemapToggle({
              view: mapView, // view that provides access to the map's 'topo' basemap
              nextBasemap: satellite, // allows for toggling to the 'Satellite' basemap
            });
            mapView.ui.add(toggle, "bottom-right");
          };
          const mapControlButton = () => {
            const homeBtn = new Home({
              view: mapView,
            });
            // Add the home button to the top left corner of the view
            mapView.ui.add(homeBtn, "top-left");

            homeBtn.goToOverride = (view, goToParams) => {
              return view.goTo(
                {
                  zoom: 5,
                  center: [106, 16],
                  tilt: 65,
                },
                {
                  speedFactor: 0.5,
                },
              );
            };

            const compass = new Compass({
              view: mapView,
            });
            mapView.ui.add(compass, "top-left");

            const scaleBar = new ScaleBar({
              view: mapView,
              unit: "dual",
            });
            mapView.ui.add(scaleBar, {
              position: "bottom-right",
            });
          };
          // Adding the layerList to the Map
          const layerListExpand = () => {
            const layerListDOM = document.getElementById("layer-list");
            const layerListExpand = new Expand({
              expandIconClass: "esri-icon-layers",
              expandTooltip: "Layer List",
              expanded: false,
              view: mapView,
              content: layerListDOM,
            });
            mapView.ui.add(layerListExpand, "top-right");

            const layerList = new LayerList({
              view: mapView,
              container: "layer-list",
            });

            mapView.ui.add(layerList, "layer-list");
          };

          // Adding the layerLegend to the Map
          const layerLegendExpand = () => {
            const layerLegendDOM = document.getElementById("layer-legend");
            const legendExpand = new Expand({
              expandIconClass: "esri-icon-documentation",
              expandTooltip: "Legend",
              expanded: false,
              view: mapView,
              content: layerLegendDOM,
            });

            mapView.ui.add(legendExpand, "bottom-left");

            const legend = new Legend({
              view: mapView,
              container: "layer-legend",
            });

            mapView.ui.add(legend, "layer-legend");
          };

          mapView.when(() => {
            baseMapToggle();
            mapControlButton();
            layerListExpand();
            layerLegendExpand();
          });
        },
      )
      .catch((err) => {
        console.error(err);
      });
  };

  const LoadScript = () => {
    const script = document.createElement("script");
    script.src = "/wemap-gl.js";
    document.head.appendChild(script);
    return new Promise((res, rej) => {
      script.onload = function () {
        res();
      };
      script.onerror = function () {
        rej();
      };
    });
  };

  useEffect(() => {
    LoadScript()
      .then(() => {
        console.log("Script loaded!");
        const mapContainer = document.getElementById("mapContainer");
        const map = new window.wemapgl.WeMap({
          container: mapContainer,
          key: "zZjAMHCwZAHTQqXIvigmZOXNiI",
          style: "bright",
          center: [105.1, 21.0],
          zoom: 13,
        });

        var directions = new window.wemapgl.WeDirections({
          key: "zZjAMHCwZAHTQqXIvigmZOXNiI",
        });
        // thêm plugin vào bản đồ
        map.addControl(directions);

        var filter = new window.wemapgl.WeFilterControl({
          filters: {
            cuisine: {
              text: "Ẩm thực",
              "fa-icon": "fa-cutlery",
              color: "#C70039",
              featureClasses: ["cafe", "restaurant", "fast_food", "food_court"],
              layers: ["poi-level-1", "poi-level-2", "poi-level-3"],
            },
            hotel: {
              text: "Nhà nghỉ",
              "fa-icon": "fa-hotel",
              color: "#C70039",
              featureClasses: ["hotel", "guest_house", "motel"],
              layers: ["poi-level-1", "poi-level-2", "poi-level-3"],
            },
            entertainment: {
              text: "Giải trí",
              "fa-icon": "fa-glass",
              color: "#C70039",
              featureClasses: [
                "bar",
                "nightclub",
                "pub",
                "theatre",
                "casino",
                "cinema",
              ],
              layers: ["poi-level-1", "poi-level-2", "poi-level-3"],
            },
            shopping: {
              text: "Mua sắm",
              "fa-icon": "fa-shopping-bag",
              color: "#C70039",
              featureClasses: [
                "shop",
                "grocery",
                "alcohol_shop",
                "jewelry",
                "mall",
                "supermarket",
                "fashion",
                "convenience",
                "marketplace",
              ],
              layers: ["poi-level-1", "poi-level-2", "poi-level-3"],
            },
          },
        });

        console.log(filter);
        // thêm plugin vào bản đồ
        map.addControl(filter, "top-left");
        map.on("click", function (e) {
          console.log(e.lngLat);
        });
      })
      .catch(() => {
        console.error("Script loading failed! Handle this error");
      });
    // init();
  }, []);
  return (
    <MainLayout>
      <div>
        <div className="h-[calc(100vh-150px)] w-full">
          <div id="mapContainer" className="h-full w-full"></div>
        </div>
        {/* <div id="viewDiv" className="h-[calc(100vh-150px)] w-full"></div>
        <div id="layer-list" className="esri-widget hidden">
          <h3 className="title title text-lg bg-blue-500 py-2 text-center font-bold text-white">
            Layer List
          </h3>
        </div>
        <div id="layer-legend" className="esri-widget hidden">
          <h3 className="title title text-lg bg-blue-500 py-2 text-center font-bold text-white">
            Layer Legend
          </h3>
        </div> */}
      </div>
    </MainLayout>
  );
};

export default HomePage;
