import { addLog, deleteLog, editLog, getAllFrequency, getAllLog, outputLog } from '@/services/hamlog/api';
import { ClockCircleOutlined, CloudUploadOutlined, DownloadOutlined, InboxOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { CheckCard, EditableProTable, ModalForm, PageContainer, ProCard, ProDescriptions, ProForm, ProFormDateRangePicker, ProFormField, ProFormSelect, ProFormText, ProFormTextArea, ProTable, TableDropdown } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { useIntl } from 'umi';
import { Avatar, Button, Flex, Form, Modal, Progress, Space, Tag, Upload, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { UploadProps } from 'antd/lib';
// 全局变量
let date: string;
let endate: string;
// 转换成标准时间戳
function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return formattedDateTime;
}
const Log: React.FC = () => {
  // 国际化
  const intl = useIntl();
  // 获取用户详情信息
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState || {};
  // 刷新表格
  interface ActionType {
    reload: (resetPageIndex?: boolean) => void;
  }
  // 详情窗体控制
  const [visibleInfoDrawer, setVisibleInfoDrawer] = useState<boolean>(false);
  // 详情值传递
  const [infoDrawerValue, setInfoDrawerValue] = useState<API.Log>();
  // 日志添加表单
  // 计时器
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  // 开始时间
  const startTimer = () => {
    // 获取当前时间
    date = getCurrentDateTime()
    // 设置开始时间
    setTimerRunning(true);
  };
  // 结束时间
  const pauseTimer = () => {
    // 获取当前时间
    endate = getCurrentDateTime()
    setTimerRunning(false);
  };
  // 重置时间
  const resetTimer = () => {
    setTimerSeconds(0);
    setTimerRunning(false);
  };
  // 动态更新时间
  useEffect(() => {
    let timerInterval: string | number | NodeJS.Timeout | undefined;
    if (timerRunning) {
      timerInterval = setInterval(() => {
        setTimerSeconds((prevSeconds) => prevSeconds + 1);
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [timerRunning]);
  // 下载信息
  const [form] = Form.useForm();
  const handleOutputSubmit = async (values: any) => {
    const response = await outputLog(values?.format);
    if (response && response.code === 200) {
      message.success(response.message + `Location: /${response.data}`);
      window.location.href = response.data;
      return true;
    } else {
      message.error(response.message);
    }
  };
  // 日志详情
  const logInfoColumns: ProColumns<API.Log>[] = [
    {
      title: intl.formatMessage({
        id: 'log.date',
      }),
      dataIndex: 'date',
      width: 100,
      valueType: 'dateTime',
    },
    {
      title: intl.formatMessage({
        id: 'log.tosign',
      }),
      width: 72,
      dataIndex: 'tosign',
    },
    {
      title: intl.formatMessage({
        id: 'log.fromsign',
      }),
      width: 72,
      dataIndex: 'fromsign',
    },
    {
      title: intl.formatMessage({
        id: 'log.method',
      }),
      width: 95,
      dataIndex: 'method',
      filters: true,
      onFilter: true,
      valueEnum: {
        'AM': { text: 'AM' },
        'FM': { text: 'FM' },
        'USB': { text: 'USB' },
        'LSB': { text: 'LSB' },
        'CW': { text: 'CW' },
      },
      render: (_, record) => {
        if (record.method === "AM") {
          return (
            <Space>
              <Tag color='green'>
                {record.method}
              </Tag>
            </Space>
          );
        } else if (record.method === "FM") {
          return (
            <Space>
              <Tag color='red'>
                {record.method}
              </Tag>
            </Space>
          );
        } else if (record.method === "USB") {
          return (
            <Space>
              <Tag color='yellow'>
                {record.method}
              </Tag>
            </Space>
          );
        } else if (record.method === "LSB") {
          return (
            <Space>
              <Tag color='yellow'>
                {record.method}
              </Tag>
            </Space>
          );
        } else if (record.method === "CW") {
          return (
            <Space>
              <Tag color='yellow'>
                {record.method}
              </Tag>
            </Space>
          );
        } else if (record.method === "FT8") {
          return (
            <Space>
              <Tag color='yellow'>
                {record.method}
              </Tag>
            </Space>
          );
        }
      },
    },
    {
      title: intl.formatMessage({
        id: 'log.frequency',
      }),
      width: 72,
      dataIndex: 'frequency',
    },
    {
      title: intl.formatMessage({
        id: 'log.band',
      }),
      width: 72,
      dataIndex: 'band',
    },
    {
      title: intl.formatMessage({
        id: 'log.band',
      }),
      width: 72,
      dataIndex: 'tosignal',
    },
    {
      title: intl.formatMessage({
        id: 'log.fromsignal',
      }),
      width: 72,
      dataIndex: 'fromsignal',
    },
    {
      title: intl.formatMessage({
        id: 'log.topower',
      }),
      width: 72,
      dataIndex: 'topower',
    },
    {
      title: intl.formatMessage({
        id: 'log.frompower',
      }),
      width: 72,
      dataIndex: 'frompower',
    },
    {
      title: intl.formatMessage({
        id: 'log.todevice',
      }),
      width: 72,
      dataIndex: 'todevice',
    },
    {
      title: intl.formatMessage({
        id: 'log.fromdevice',
      }),
      width: 72,
      dataIndex: 'fromdevice',
    },
    {
      title: intl.formatMessage({
        id: 'log.toantenna',
      }),
      width: 72,
      dataIndex: 'toantenna',
    },
    {
      title: intl.formatMessage({
        id: 'log.fromantenna',
      }),
      width: 72,
      dataIndex: 'fromantenna',
    },
    {
      title: intl.formatMessage({
        id: 'log.toqth',
      }),
      width: 72,
      dataIndex: 'toqth',
    },
    {
      title: intl.formatMessage({
        id: 'log.fromqth',
      }),
      width: 72,
      dataIndex: 'fromqth',
    },
    {
      title: intl.formatMessage({
        id: 'log.content',
      }),
      width: 72,
      dataIndex: 'content',
      ellipsis: true,
      copyable: true,
    },
  ]
  // 日志列表列
  const columns: ProColumns<API.Log>[] = [
    {
      dataIndex: 'index',
      valueType: 'indexBorder',
    },
    {
      title: intl.formatMessage({
        id: 'log.date',
      }),
      key: 'date',
      dataIndex: 'date',
      valueType: 'dateTime',
    },
    {
      title: intl.formatMessage({
        id: 'log.tosign',
      }),
      dataIndex: 'tosign',
    },
    {
      title: intl.formatMessage({
        id: 'log.fromsign',
      }),
      search: false,
      dataIndex: 'fromsign',
    },
    {
      title: intl.formatMessage({
        id: 'log.method',
      }),
      dataIndex: 'method',
      filters: true,
      onFilter: true,
      valueEnum: {
        'AM': { text: 'AM' },
        'FM': { text: 'FM' },
        'USB': { text: 'USB' },
        'LSB': { text: 'LSB' },
        'CW': { text: 'CW' },
        'RTTY': { text: 'RTTY' },
        'FT8': { text: 'FT8' },
      },
      render: (_, record) => {
        if (record.method === "AM") {
          return (
            <Space>
              <Tag color='red'>
                {record.method}
              </Tag>
            </Space>
          );
        } else if (record.method === "FM") {
          return (
            <Space>
              <Tag color='yellow'>
                {record.method}
              </Tag>
            </Space>
          );
        } else if (record.method === "USB") {
          return (
            <Space>
              <Tag color='blue'>
                {record.method}
              </Tag>
            </Space>
          );
        } else if (record.method === "LSB") {
          return (
            <Space>
              <Tag color='green'>
                {record.method}
              </Tag>
            </Space>
          );
        } else if (record.method === "CW") {
          return (
            <Space>
              <Tag color='pink'>
                {record.method}
              </Tag>
            </Space>
          );
        } else if (record.method === "RTTY") {
          return (
            <Space>
              <Tag color='volcano'>
                {record.method}
              </Tag>
            </Space>
          );
        } else if (record.method === "FT8") {
          return (
            <Space>
              <Tag color='orange'>
                {record.method}
              </Tag>
            </Space>
          );
        }
      },
    },
    {
      title: intl.formatMessage({
        id: 'log.frequency',
      }),
      dataIndex: 'frequency',
      render(_, record) {
        return (
          <span>{record?.frequency}</span>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'log.band',
      }),
      dataIndex: 'band',
    },
    {
      title: intl.formatMessage({
        id: 'log.tosignal',
      }),
      search: false,
      dataIndex: 'tosignal',
      render(_, record) {
        return (
          <span>{record?.tosignal} (RSST)</span>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'log.topower',
      }),
      search: false,
      dataIndex: 'topower',
      render(_, record) {
        return (
          <span>{record?.topower} (W)</span>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'log.todevice',
      }),
      search: false,
      dataIndex: 'todevice',
    },
    {
      title: intl.formatMessage({
        id: 'log.toantenna',
      }),
      search: false,
      dataIndex: 'toantenna',
    },
    {
      title: intl.formatMessage({
        id: 'log.toqth',
      }),
      dataIndex: 'toqth',
    },
    {
      title: intl.formatMessage({
        id: 'log.content',
      }),
      dataIndex: 'content',
      ellipsis: true,
      copyable: true,
    },
    {
      title: intl.formatMessage({
        id: 'log.option',
      }),
      valueType: 'option',
      key: 'option',
      render: (text, record, _, action) => [
        <a
          key="editable"
          onClick={() => {
            action?.startEditable?.(record.id as number);
          }}
        >
          {intl.formatMessage({
            id: 'log.edit',
          })}
        </a>,
        <a
          key="view"
          onClick={() => {
            setInfoDrawerValue(record);
            setVisibleInfoDrawer(true);
        }}
        >
          {intl.formatMessage({
            id: 'log.view',
          })}
        </a>,
        <TableDropdown
          key="actionGroup"
          onSelect={(key) => {
            if (key === 'delete') {
              deleteLog(record.id as number);
              ref.current.reload();
              action?.reload();
            }
            action?.reload();
            ref.current.reload();
          }}
          menus={[
            { 
              key: 'delete', 
              name: intl.formatMessage({
                id: 'log.delete',
              }),
            },
          ]}
        />,
      ],
    },
  ];
  // 日志上传更新表示符
  const { Dragger } = Upload;
  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/v1/log/input',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    onChange(info) {
        const { status } = info.file;
        if (status === 'done') {
          message.success(`${info.file.name} 文件上传成功！`);
        } else if (status === 'error') {
          message.error(`${info.file.name} 文件解析失败！`); 
        }
    },
  };
  // 表格刷新控制
  const ref = useRef<ActionType>();
  return (
    <PageContainer>
      {/* 日志详情信息 */}
      <Modal
        width={680}
        title={infoDrawerValue?.fromsign + ' > ' + infoDrawerValue?.tosign}
        footer={null}
        open={visibleInfoDrawer}
        onCancel={()=>{setVisibleInfoDrawer(false)}}
      >
        <div className="bg-gradient-to-b from-[#123597] to-[#97ABFF] text-white p-2 rounded-md mb-8 mt-8" style={{
          boxShadow: 'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px',
          boxShadow: 'rgba(60, 64, 67, 0.15) 0px 1px 3px 1px'
        }}>
          <div className='m-4'>
            <p>{intl.formatMessage({id: 'log.connection_date'})}{infoDrawerValue?.date}</p>
          </div>
          <div className='flex flex-row text-center self-auto'>
            <div className='flex-1'>
              <p className='text-sm'>{infoDrawerValue?.date}</p>
              <p className='text-2xl'>{infoDrawerValue?.fromsign}</p>
              <p className='text-sm'>{infoDrawerValue?.fromqth}</p>
            </div>
            <div className='flex-1'>
              <p className='text-base'>{infoDrawerValue?.method}</p>
              <p className='text-xl'>{infoDrawerValue?.duration} {intl.formatMessage({id: 'log.second'})}</p>
            </div>
            <div className='flex-1 text-2xl'>
              <p className='text-sm'>{infoDrawerValue?.endate}</p>
              <p className='text-2xl'>{infoDrawerValue?.tosign}</p>
              <p className='text-sm'>{infoDrawerValue?.toqth} ({infoDrawerValue?.address?.country})</p>
            </div>
          </div>
        </div>
        {infoDrawerValue?.tosign && (
          <ProDescriptions<API.Log>
              column={2}
              request={async () => ({
                  data: infoDrawerValue || {},
              })}
              params={{
                  id: infoDrawerValue?.id,
              }}
              columns={logInfoColumns as ProColumns<API.Log>[]}
          >
          </ProDescriptions>
        )}
      </Modal>
      <EditableProTable<API.Log>
        recordCreatorProps={false}
        columns={columns}
        request={getAllLog}
        rowKey="id"
        editable={{
          type: 'single',
          onSave: async (rowKey, data) => {
            delete data.id;
            delete data.index;
            editLog(rowKey as number, data);
          },
        }}
        actionRef={ref}
        search={{
          labelWidth: 'auto',
        }}
        options={{
          setting: {
            listsHeight: 400,
          },
        }}
        pagination={{
          pageSize: 20,
          onChange: (page) => console.log(page),
        }}
        dateFormatter="string"
        toolBarRender={() => [
          // 新建通联窗口
          <Flex wrap="wrap" gap="small">
            <ModalForm<API.Log>
              modalProps={{
                destroyOnClose: true,
              }}
              initialValues={logInfoColumns}
              onFinish={async (values) => {
                const response = await addLog({
                  ...values,
                  date: date,
                  endate: endate,
                });
                if (response && response.code === 200) {
                  message.success(response.message);
                  setTimerSeconds(0);
                  setTimerRunning(false);
                  ref.current.reload();
                  return true;
                } else {
                  message.error(response.message);
                } 
              }}
              trigger={
                <Button type="primary"
                  id='log.connection_add'
                >
                  <PlusOutlined />
                  {intl.formatMessage({id: 'log.connection_add'})}
                </Button>
              }
            >
              <Flex gap="small" wrap="wrap" className="m-4">
                <Progress percent={timerSeconds / 1000} showInfo={false} />
                <div>
                  <p>{intl.formatMessage({id: 'log.connection_times'})}{timerSeconds / 1000} {intl.formatMessage({id: 'log.second'})}</p>
                  {!timerRunning ? (
                    <Button type="primary" icon={<ClockCircleOutlined />} className='m-2' onClick={startTimer}>
                      {intl.formatMessage({id: 'log.connection_start'})}
                    </Button>
                  ) : (
                    <>
                      <Button type="primary" icon={<ClockCircleOutlined />} className='m-2' onClick={pauseTimer}>
                      {intl.formatMessage({id: 'log.connection_end'})}
                      </Button>
                      <Button type="primary" icon={<ClockCircleOutlined />} className='m-2' onClick={resetTimer}>
                      {intl.formatMessage({id: 'log.connection_reset'})}
                      </Button>
                    </>
                  )}
                </div>
              </Flex>
              <ProForm.Group>
                <ProFormText
                  name="tosign"
                  width="md"
                  label={intl.formatMessage({id: 'log.tosign'})}
                  required
                  placeholder={intl.formatMessage({id: 'log.tosign_placeholder'})}
                />
                <ProFormText
                  name="fromsign"
                  width="md"
                  label={intl.formatMessage({id: 'log.fromsign'})}
                  initialValue={currentUser?.callsign}
                  placeholder={intl.formatMessage({id: 'log.fromsign_placeholder'})}
                />
                <ProFormText
                  name="frequency"
                  width="md"
                  label={intl.formatMessage({id: 'log.frequency'})}
                  required
                  placeholder={intl.formatMessage({id: 'log.frequency_placeholder'})}
                />
                <ProFormSelect
                  label={intl.formatMessage({id: 'log.frequency_exists'})}
                  name="frequency"
                  showSearch
                  width={'md'}
                  request={async () => {
                    const data = await getAllFrequency();
                    return data.data.map((item: API.Frequency) => ({
                      label: item.name,
                      value: item.transmit_uplink,
                    }));
                  }}
                  debounceTime={300}
                  placeholder={intl.formatMessage({id: 'log.frequency_placeholder'})}
                />
                <ProFormSelect
                  name="band"
                  width="md"
                  showSearch
                  label={intl.formatMessage({id: 'log.band'})}
                  placeholder={intl.formatMessage({id: 'log.band_placeholder'})}
                  options={[
                    {
                      value: '2190M',
                      label: '2190M (135-138 kHz)',
                    },
                    {
                      value: '630M',
                      label: '630M (472-479 kHz)',
                    },
                    {
                      value: '160M',
                      label: '160M (1.8-2 MHz)',
                    },
                    {
                      value: '80M',
                      label: '80M (3.5-4 MHz)',
                    },
                    {
                      value: '60M',
                      label: '60M (5.25-5.45 MHz)',
                    },
                    {
                      value: '40M',
                      label: '40M (7-7.3 MHz)',
                    },
                    {
                      value: '30M',
                      label: '30M (10.1-10.15 MHz)',
                    },
                    {
                      value: '20M',
                      label: '20M (14-14.35 MHz)',
                    },
                    {
                      value: '17M',
                      label: '17M (18.068-18.168 MHz)',
                    },
                    {
                      value: '15M',
                      label: '15M (21-21.45 MHz)',
                    },
                    {
                      value: '12M',
                      label: '12M (24.89-24.99 MHz)',
                    },
                    {
                      value: '10M',
                      label: '10M (28-29.7 MHz)',
                    },
                    {
                      value: '6M',
                      label: '6M (50-54 mHz)',
                    },
                    {
                      value: '4M',
                      label: '4M (70-71 mHz)',
                    },
                    {
                      value: '2M',
                      label: '2M (144-148 mHz)',
                    },
                    {
                      value: '1.25M',
                      label: '1.25M (220-225 mHz)',
                    },
                    {
                      value: '70CM',
                      label: '70CM (420-450 mHz)',
                    },
                    {
                      value: '33CM',
                      label: '33CM (902-928 mHz)',
                    },
                    {
                      value: '23CM',
                      label: '23CM (1.24-1.3 GHz)',
                    },
                    {
                      value: '13CM',
                      label: '13CM (2.3-2.45 GHz)',
                    },
                    {
                      value: '9CM',
                      label: '9CM (3.3-3.5 GHz)',
                    },
                    {
                      value: '6CM',
                      label: '6CM (5.65-5.925 GHz)',
                    },
                    {
                      value: '3CM',
                      label: '3CM (10-10.5 GHz)',
                    },
                    {
                      value: '1.25CM',
                      label: '1.25CM (24-24.25 GHz)',
                    },
                    {
                      value: '6CM',
                      label: '6CM (5.65-5.925 GHz)',
                    },
                    {
                      value: '3CM',
                      label: '3CM (10-10.5 GHz)',
                    },
                    {
                      value: '1.25CM',
                      label: '1.25CM (24-24.25 GHz)',
                    },
                    {
                      value: '6MM',
                      label: '6MM (47-47.2 GHz)',
                    },
                    {
                      value: '4MM',
                      label: '4MM (75.5-81 GHz)',
                    },
                    {
                      value: '2.5MM',
                      label: '2.5MM (122.25-123 GHz)',
                    },
                    {
                      value: '2MM',
                      label: '2MM (142-149 GHz)',
                    },
                    {
                      value: '1MM',
                      label: '1MM (241-250 GHz)',
                    },
                    {
                      value: 'SUBMM',
                      label: 'SUBMM (300-2e+006 GHz)',
                    },
                  ]}
                />
              </ProForm.Group>
              <ProForm.Group>
                <ProFormSelect
                  name="method"
                  width="md"
                  showSearch
                  label={intl.formatMessage({id: 'log.method'})}
                  required
                  placeholder={intl.formatMessage({id: 'log.method_placeholder'})}
                  options={[
                    {
                      value: 'AM',
                      label: 'AM'
                    },
                    {
                      value: 'FM',
                      label: 'FM'
                    },
                    {
                      value: 'USB',
                      label: 'USB'
                    },
                    {
                      value: 'LSB',
                      label: 'LSB'
                    },
                    {
                      value: 'CW',
                      label: 'CW'
                    },
                    {
                      value: 'RTTY',
                      label: 'RTTY'
                    },
                    {
                      value: 'FT8',
                      label: 'FT8'
                    },
                  ]}
                />
              </ProForm.Group>
              <ProForm.Group>
                <ProFormText
                  name="tosignal"
                  width="md"
                  label={intl.formatMessage({id: 'log.tosignal'})}
                  required
                  placeholder={intl.formatMessage({id: 'log.tosignal_placeholder'})}
                />
                <ProFormText
                  name="fromsignal"
                  width="md"
                  label={intl.formatMessage({id: 'log.fromsignal'})}
                  placeholder={intl.formatMessage({id: 'log.fromsignal_placeholder'})}
                />
                <ProFormText
                  name="topower"
                  width="md"
                  required
                  label={intl.formatMessage({id: 'log.topower'})}
                  placeholder={intl.formatMessage({id: 'log.topower_placeholder'})}
                />
                <ProFormText
                  name="frompower"
                  width="md"
                  label={intl.formatMessage({id: 'log.frompower'})}
                  initialValue={currentUser?.power}
                  placeholder={intl.formatMessage({id: 'log.frompower_placeholder'})}
                />
                <ProFormText
                  name="todevice"
                  width="md"
                  label={intl.formatMessage({id: 'log.todevice'})}
                  required
                  placeholder={intl.formatMessage({id: 'log.todevice_placeholder'})}
                />
                <ProFormText
                  name="fromdevice"
                  width="md"
                  label={intl.formatMessage({id: 'log.fromdevice'})}
                  initialValue={currentUser?.device}
                  placeholder={intl.formatMessage({id: 'log.fromdevice_placeholder'})}
                />
                <ProFormText
                  name="toantenna"
                  required
                  width="md"
                  label={intl.formatMessage({id: 'log.toantenna'})}
                  placeholder={intl.formatMessage({id: 'log.toantenna_placeholder'})}
                />
                <ProFormText
                  name="fromantenna"
                  width="md"
                  label={intl.formatMessage({id: 'log.fromantenna'})}
                  initialValue={currentUser?.antenna}
                  placeholder={intl.formatMessage({id: 'log.fromantenna_placeholder'})}
                />
                <ProFormText
                  name="country"
                  width="md"
                  label={intl.formatMessage({id: 'log.country'})}
                  placeholder={intl.formatMessage({id: 'log.country_placeholder'})}
                />
                <ProFormText
                  name="fromcountry"
                  width="md"
                  label={intl.formatMessage({id: 'log.fromcountry'})}
                  initialValue={currentUser?.country}
                  placeholder={intl.formatMessage({id: 'log.fromcountry_placeholder'})}
                />
                <ProFormText
                  name="toqth"
                  required
                  width="md"
                  label={intl.formatMessage({id: 'log.toqth'})}
                  placeholder={intl.formatMessage({id: 'log.toqth_placeholder'})}
                />
                <ProFormText
                  name="fromqth"
                  width="md"
                  label={intl.formatMessage({id: 'log.fromqth'})}
                  initialValue={currentUser?.stationaddress}
                  placeholder={intl.formatMessage({id: 'log.fromqth_placeholder'})}
                />
              </ProForm.Group>
              <ProForm.Group>
                <ProFormTextArea
                  name="content"
                  label={intl.formatMessage({id: 'log.content'})}
                  width={'lg'}
                  placeholder={intl.formatMessage({id: 'log.content_placeholder'})}
                />
              </ProForm.Group>
            </ModalForm>
            <ModalForm
              title={intl.formatMessage({id : 'log.input_log'})}
              trigger={
                <Button
                key="button"
                icon={<UploadOutlined />}
                type="primary"
                >
                {intl.formatMessage({id : 'log.input_log'})}
                </Button>
              }
              submitter={{
                resetButtonProps: {
                  type: 'dashed',
                },
                submitButtonProps: {
                  style: {
                    display: 'none',
                  },
                },
              }}
              autoFocusFirstInput
            >
              <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">{intl.formatMessage({id: 'log.upload_text'})}</p>
                <p className="ant-upload-hint">
                {intl.formatMessage({id: 'log.upload_hint'})}
                </p>
              </Dragger>
            </ModalForm>
            <ModalForm
            onFinish={handleOutputSubmit}
            form={form}
            title={intl.formatMessage({id : 'log.output_log'})}
            trigger={
              <Button
              key="button"
              icon={<DownloadOutlined />}
              type="primary"
              >
              {intl.formatMessage({id : 'log.output_log'})}
              </Button>
            }
            autoFocusFirstInput
            >
            <ProCard
              layout='center'
            >
              <Form.Item name="format" label={intl.formatMessage({id: 'log.download_method'})}>
                <CheckCard.Group>
                  {/* <CheckCard
                    title={intl.formatMessage({id: 'log.adif_output'})}
                    disabled
                    avatar={
                      <Avatar
                        src="/data.svg"
                        size="large"
                      />
                    }
                    description={intl.formatMessage({id: 'log.adif_output_description'})}
                    value="adi"
                  /> */}
                  <CheckCard
                    title={intl.formatMessage({id: 'log.csv_output'})}
                    avatar={
                      <Avatar
                        src="/csv.svg"
                        size="large"
                      />
                    }
                    description={intl.formatMessage({id: 'log.csv_output_description'})}
                    value="csv"
                  />
                </CheckCard.Group>
              </Form.Item>
            </ProCard>
            </ModalForm>
          </Flex>
        ]}
      />
    </PageContainer>
  );
};

export default Log;