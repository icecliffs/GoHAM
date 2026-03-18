import { getScreenData } from "@/services/hamlog/api";
import { Bar, Line, Pie } from "@ant-design/plots";
import { PageContainer, ProCard, StatisticCard } from "@ant-design/pro-components";
import { Scene, LineLayer, PointLayer, MapTheme, Control, Fullscreen, PolygonLayer, Scale } from "@antv/l7";
import { GaodeMap } from "@antv/l7-maps";
import { Flex, Layout } from "antd";
import Sider from "antd/es/layout/Sider";
import { Header, Content, Footer } from "antd/es/layout/layout";
import { useEffect, useState } from "react";
import { useIntl, useModel } from 'umi';
const token = localStorage.getItem('token');

// 统计通联国家次数前十
const CountriesTop10 = ({ data }: { data: any }) => {
  const config = {
    data: data.data.top10country,
    xField: 'times',
    yField: 'country',
    legend: {
      position: 'top-left',
    },
    barBackground: {
      style: {
        fill: 'rgba(0,0,0,0.1)',
      },
    },
    interactions: [
      {
        type: 'active-region',
        enable: false,
      },
    ],
  };
  return <Bar {...config} />;
};

// 最常使用的波段
const BandTop10 = ({ data }: { data: any }) => {
  const config = {
    data: data.data.top10band,
    xField: 'times',
    yField: 'band',
    legend: {
      position: 'top-left',
    },
    barBackground: {
      style: {
        fill: 'rgba(0,0,0,0.1)',
      },
    },
    interactions: [
      {
        type: 'active-region',
        enable: false,
      },
    ],
  };
  return <Bar {...config} />;
};
// 最常使用的方式
const MethodTop10 = ({ data }: { data: any }) => {
  const config = {
    appendPadding: 10,
    data: data.data.top10method,
    angleField: 'times',
    colorField: 'method',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
    interactions: [
      {
        type: 'pie-legend-active',
      },
      {
        type: 'element-active',
      },
    ],
  };
  return <Pie {...config} />;
};
// 通联时间段分布
const TimeTop10 = ({ data }: { data: any }) => {
  const config = {
    data: data.data.cntcountries,
    xField: 'date',
    yField: 'times',
    seriesField: 'country',
    legend: {
      position: 'top',
    },
    smooth: true,
    // @TODO 后续会换一种动画方式
    animation: {
      appear: {
        animation: 'path-in',
        duration: 5000,
      },
    },
  };
  return <Line {...config} />;
};
// 通联概况
const StatisticLog = ({ data }: { data: any }) => {
  // 国际化处理
  const intl = useIntl();
  return (
    <>
      <StatisticCard
        statistic={{
          title: intl.formatMessage({id: 'screen.qso'}),
          value: data.data.cnt,
          icon: (
            <img
              src="/radio.svg"
              width={20}
              alt="icon"
            />
          ),
        }}
      ></StatisticCard>
    </>
  );
};
const Screen: React.FC = () => {
const { initialState } = useModel('@@initialState');
const { currentUser } = initialState || {};
// 统计QSO通联次数前十
const QSOsTop10 = ({ data }: { data: any }) => {
  const config = {
    data: data.data.top10qso,
    xField: 'times',
    yField: 'tosign',
    legend: {
      position: 'top-left',
    },
    barBackground: {
      style: {
        fill: 'rgba(0,0,0,0.1)',
      },
    },
    interactions: [
      {
        type: 'active-region',
        enable: false,
      },
    ],
  };
  return <Bar {...config} />;
};
  const intl = useIntl();
  // 调用API获取大屏数据
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/v1/display', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error(intl.formatMessage({id: 'screen.data_error'}), error);
      }
    };
    fetchData();
  }, []);
// 世界地图通联弧线
const WorldMap = ({ data }: { data: any }) => {
  useEffect(() => {
    const scene = new Scene({
      id: 'map',
      map: new GaodeMap({
        style: 'dark',
        token: 'fc1505425be7f7ce44373530fe77e232',
        center: [ 107.77791556935472, 35.443286920228644 ],
        zoom: 2.9142882493605033
      }),
    });
    scene.on('loaded', () => {
      const mapTheme = new MapTheme();
      scene.addControl(mapTheme);
      fetch('/api/v1/display', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          // 3D图层
          const layer3d = new LineLayer({
        blend: 'normal'
          })
        .source(data.data.worldmap, {
          parser: {
            type: 'json',
            x: 'longitude1',
            y: 'latitude1',
            x1: 'longitude2',
            y1: 'latitude2',
          }
        })
        .size(2)
        .shape('arc3d')
        .color('method', ['#5B8FF9', '#5CCEA1', '#F6BD16'])
        .animate({
          interval: 0.2,
          trailLength: 0.3,
          duration: 5
        })
        .style({
          opacity: 1
        });
          // 标签文字
          const fontLayer = new PointLayer({})
          .source(data.data.worldmap, {
            parser: {
              type: 'json',
              x: 'longitude2',
              y: 'latitude2'
            }
          })
          .shape('tosign', 'text')
          .size(12)
          .color('#000')
          .style({
            textAnchor: 'center',
            textOffset: [ 0, 0 ],
            spacing: 2,
            padding: [ 1, 1 ],
            stroke: '#000',
            strokeWidth: 0.5,
          });
          // 柱状图层
          const columnarLayer = new PointLayer({})
          .source(data.data.worldmap, {
            parser: {
              type: 'json',
              x: 'longitude2',
              y: 'latitude2'
            }
          })
          .shape('cylinder')
          .size('latitude2', function(level) {
            return [ 2, 2, level * 2 + 20 ];
          })
          .animate(true)
          .active(true)
          .color('latitude2', ['#4A90E2', '#FF6347', '#2E8B57', '#FFD700', '#8A2BE2', '#00CED1', '#FF4500'])
          // 右下角线标
          const color = [
            "rgb(74, 144, 226)",
            "rgb(255, 99, 71)",
            "rgb(46, 139, 87)",
            "rgb(255, 215, 0)",
            "rgb(138, 43, 226)",
            "rgb(0, 206, 209)",
            "rgb(255, 69, 0)",
          ];
          const layer = new PolygonLayer({})
            .source(data)
            .shape("fill")
            .active(true)
            .style({
              opacity: 1.0
            });
          const layer2 = new LineLayer({
            zIndex: 2
          })
            .source(data)
            .color("#fff")
            .active(true)
            .size(1)
            .style({
              lineType: "dash",
              dashArray: [2, 2],
              opacity: 1
            });
          scene.addLayer(layer); // 填充图
          scene.addLayer(layer2); // 描边
          // 添加地图图例
          const legend = new Control({
            position: "bottomright"
          });
          legend.onAdd = function () {
            var el = document.createElement("div");
            el.className = "infolegend legend";
            var grades = ['AM', 'FM', 'USB', 'LSB', 'CW', 'RTTY', 'FT8'];
            for (var i = 0; i < grades.length; i++) {
              el.innerHTML +=
                '<i style="background:' +
                color[i] +
                '"></i> ' +
                grades[i] +
                ("<br>");
            }
            return el;
          };
          // 控制全屏
          const fullscreen = new Fullscreen({
            btnText: intl.formatMessage({id: 'screen.btnText'}),
            exitBtnText: intl.formatMessage({id: 'screen.exitBtnText'}),
          });
          // 2D层实现（暂不开放）
          // const layer = new LineLayer({})
          //   .source(data.data.worldmap, {
          //     parser: {
          //       type: 'json',
          //       x: 'longitude1',
          //       y: 'latitude1',
          //       x1: 'longitude2',
          //       y1: 'latitude2',
          //     },
          //   })
          //   .shape('fromsign', 'tosign')
          //   .size(1)
          //   .shape('greatcircle')
          //   .animate({
          //     enable: true,
          //     interval: 0.1,
          //     trailLength: 1.5,
          //     duration: 1
          //   })
          //   .color('#fc3d49')
          // 控制地图缩放
          const scale = new Scale({
            zoomInTitle: intl.formatMessage({id: 'screen.zoomInTitle'}),
            zoomOutTitle: intl.formatMessage({id: 'screen.zoomOutTitle'}),
          });
          // 
          // 地图标注
          scene.addControl(legend);
          // 地图缩放
          scene.addControl(scale);
          // 全屏
          scene.addControl(fullscreen);
          // 呼号字体
          scene.addLayer(fontLayer);
          // 柱状图
          scene.addLayer(columnarLayer);
          // 3D地图
          scene.addLayer(layer3d);
        });
    });
  }, []);
  return <ProCard 
          id="map"
          style={{width: '100%', height: '700px'}}
          />;
};
  return (
    <PageContainer
      title=" "
    >
      <>
        {data && (
          <>
            <Flex wrap="wrap" vertical>
              <ProCard gutter={10}>
                <ProCard colSpan={20}>
                  <WorldMap data={data} />
                </ProCard>
                <ProCard split="horizontal">
                  <ProCard title={intl.formatMessage({id: 'screen.communication_situation'})} style={{ height: '350px' }}>
                    <StatisticLog data={data} />
                  </ProCard>
                  <ProCard title={intl.formatMessage({id: 'screen.communication_qso_top_10'})} style={{ height: '350px' }}>
                    <QSOsTop10 data={data} />
                  </ProCard>
                </ProCard>
              </ProCard>
            </Flex>
            <Flex wrap="wrap" gap="small">
              <ProCard gutter={10}>
                <ProCard title={intl.formatMessage({id: 'screen.communication_country_top_10'})} colSpan={4} >
                  <CountriesTop10 data={data} />
                </ProCard>
                <ProCard title={intl.formatMessage({id: 'screen.communication_band_top_10'})} colSpan={4} >
                  <BandTop10 data={data}/>
                </ProCard>
                <ProCard title={intl.formatMessage({id: 'screen.communication_method_top_10'})} colSpan={6} >
                  <MethodTop10 data={data}/>
                </ProCard>
                <ProCard title={intl.formatMessage({id: 'screen.communication_time_top_10'})} >
                  <TimeTop10 data={data}/>
                </ProCard>
              </ProCard>
            </Flex>
          </>
        )}
      </>
    </PageContainer>
  );
};

export default Screen;