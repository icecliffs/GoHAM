import React, { useState } from 'react';
import { EditableProTable, ModalForm, PageContainer, ProCard, ProColumns, ProDescriptions, ProForm, ProFormText } from "@ant-design/pro-components";
import { Button, Descriptions, Flex, Form, Image, Modal, Space, Upload, UploadFile, UploadProps, message } from "antd";
import { addFrequency, changeUserInfo, deleteFrequency, editFrequency, getAllFrequency, getUser } from '@/services/hamlog/api';
import { useRequest } from 'umi';
import { useIntl } from 'umi';
import { useModel } from '@umijs/max';

const Account: React.FC = () => {
     // 国际化
     const intl = useIntl();
     // 用户详情信息编辑
     const [infoValue, setInfoValue] = useState<API.User>();
     // 用户详情信息编辑窗口加载
     const [visibleInfo, setVisibleInfo] = useState<boolean>(false);
     // 获取最新的id然后+1
     const { data } = useRequest(getAllFrequency);
     // 获取用户详情信息
     const { initialState } = useModel('@@initialState');
     const { currentUser } = initialState || {};
     // 频率列表
     const frequencyColumns: ProColumns<API.Frequency>[] = [
          {
               dataIndex: 'index',
               valueType: 'indexBorder',
               width: 48,
          },
          {
               title: intl.formatMessage({id: 'frequency.type'}),
               width: 70,
               dataIndex: 'type',
          },
          {
               title: intl.formatMessage({id: 'frequency.name'}),
               dataIndex: 'name',
          },
          {
               title: intl.formatMessage({id: 'frequency.receive_downlink'}),
               dataIndex: 'receive_downlink',
          },
          {
               title: intl.formatMessage({id: 'frequency.frequency_difference'}),
               width: 90,
               dataIndex: 'frequency_difference',
          },
          {
               title: intl.formatMessage({id: 'frequency.transmit_uplink'}),
               dataIndex: 'transmit_uplink',
          },
          {
               title: intl.formatMessage({id: 'frequency.subsone'}),
               dataIndex: 'subsone',
          },
          {
               title: intl.formatMessage({id: 'frequency.notes'}),
               dataIndex: 'notes',
          },
          {
               title: intl.formatMessage({id: 'frequency.addate'}),
               dataIndex: 'addate',
               valueType: 'dateTime',
          },
          {
               title: intl.formatMessage({id: 'frequency.option'}),
               valueType: 'option',
               width: 200,
               render: (text, record, _, action) => [
                    // <a
                    //      key="editable"
                    //      onClick={() => {
                    //           action?.startEditable?.(record.id as number);
                    //      }}
                    // >
                    //      编辑
                    // </a>,
                    <a
                         key="delete"
                         onClick={async () => {
                              const response = await deleteFrequency(record.id as number);
                              if (response && response.code === 200) {
                                   message.success(response.message);
                              } else {
                                   message.error(response.message);
                              }
                              action?.reload();
                         }}
                    >
                         {intl.formatMessage({id: 'frequency.delete'})}
                    </a>,
               ],
          },
     ];
     // 用户窗体
     const [form] = Form.useForm();
     return (
          <>
               <PageContainer
                    ghost
                    header={{
                    title: intl.formatMessage({id: 'account.personal_center'}),
                    }}
               >    
                    <ProCard 
                    gutter={16} 
                    split="vertical"
                    >
                         <ProCard
                              title={intl.formatMessage({id : 'account.user_details'})}
                              colSpan="30%"
                         >
                              <h4>{intl.formatMessage({id: 'account.basicinfo'})}</h4>
                              <p>{intl.formatMessage({id: 'account.name'})}{currentUser?.name}</p>
                              <p>{intl.formatMessage({id: 'account.email'})}{currentUser?.email}</p>
                              <p>{intl.formatMessage({id: 'account.callsign'})}{currentUser?.callsign}</p>
                              <p>{intl.formatMessage({id: 'account.stationaddress'})}{currentUser?.stationaddress}</p>
                              <p>{intl.formatMessage({id: 'account.country'})}{currentUser?.country}</p>
                              <p>{intl.formatMessage({id: 'account.province'})}{currentUser?.province}</p>
                              <p>{intl.formatMessage({id: 'account.city'})}{currentUser?.city}</p>
                              <p>{intl.formatMessage({id: 'account.code'})}{currentUser?.code}</p>
                              <p>{intl.formatMessage({id: 'account.gird'})}{currentUser?.gird}</p>
                              <p>{intl.formatMessage({id: 'account.cqzone'})}{currentUser?.cqzone}</p>
                              <p>{intl.formatMessage({id: 'account.ituzone'})}{currentUser?.ituzone}</p>
                              <h4>{intl.formatMessage({id: 'account.deviceinfo'})}</h4>
                              <p>{intl.formatMessage({id: 'account.device'})}{currentUser?.device}</p>
                              <p>{intl.formatMessage({id: 'account.antenna'})}{currentUser?.antenna}</p>
                              <p>{intl.formatMessage({id: 'account.power'})}{currentUser?.power} (W)</p>
                              {/* 用户编辑详情窗体 */}
                              <ModalForm<API.User>
                                   title={intl.formatMessage({id: 'account.details_editing'})}
                                   form={form}
                                   trigger={
                                        <Button 
                                        type="primary"
                                        className='m-2'
                                        onClick={() => {
                                             setInfoValue(currentUser);
                                             setVisibleInfo(true);
                                        }}
                                        >{intl.formatMessage({id: 'account.user_editing'})}</Button>
                                   }
                                   onFinish={async (values) => {
                                        console.log('id: ' + values.id);
                                        const response = await changeUserInfo(currentUser?.id as number, values);
                                        if (response && response.code === 200) {
                                             message.success(response.message);
                                             window.location.reload();
                                             return true;
                                        } else {
                                             message.error(response.message);
                                        }
                                   }}
                              >
                                   <ProForm.Group>
                                        <ProFormText
                                             name="id"
                                             hidden
                                        >
                                        </ProFormText>
                                        <ProFormText
                                             width="md"
                                             name="name"
                                             label={intl.formatMessage({id: 'account.name'})}
                                             required
                                             initialValue={currentUser?.name}
                                             placeholder={intl.formatMessage({id: 'account.name_placeholder'})}
                                        />
                                        <ProFormText
                                             width="md"
                                             name="email"
                                             required
                                             initialValue={currentUser?.email}
                                             label={intl.formatMessage({id: 'account.email'})}
                                             placeholder={intl.formatMessage({id: 'account.email_placeholder'})}
                                        />
                                   </ProForm.Group>
                                   <ProForm.Group>
                                        <ProFormText
                                             width="md"
                                             name="address"
                                             required
                                             label={intl.formatMessage({id: 'account.address'})}
                                             initialValue={currentUser?.address}
                                             placeholder={intl.formatMessage({id: 'account.address_placeholder'})}
                                        />
                                        <ProFormText
                                             width="md"
                                             required
                                             name="city"
                                             initialValue={currentUser?.city}
                                             label={intl.formatMessage({id: 'account.city'})}
                                             placeholder={intl.formatMessage({id: 'account.city'})}
                                        />
                                        <ProFormText
                                             width="md"
                                             required
                                             name="province"
                                             initialValue={currentUser?.province}
                                             label={intl.formatMessage({id: 'account.province'})}
                                             placeholder={intl.formatMessage({id: 'account.province_placeholder'})}
                                        />
                                        <ProFormText
                                             required
                                             width="md"
                                             name="code"
                                             initialValue={currentUser?.code}
                                             label={intl.formatMessage({id: 'account.code'})}
                                             placeholder={intl.formatMessage({id: 'account.code_placeholder'})}
                                        />
                                        <ProFormText
                                             width="md"
                                             required
                                             name="country"
                                             initialValue={currentUser?.country}
                                             label={intl.formatMessage({id: 'account.country'})}
                                             placeholder={intl.formatMessage({id: 'account.country_placeholder'})}
                                        />
                                        <ProFormText
                                             width="md"
                                             required
                                             name="gird"
                                             initialValue={currentUser?.gird}
                                             label={intl.formatMessage({id: 'account.gird'})}
                                             placeholder={intl.formatMessage({id: 'account.gird_placeholder'})}
                                        />
                                        <ProFormText
                                             width="md"
                                             required
                                             name="cqzone"
                                             initialValue={currentUser?.cqzone}
                                             label={intl.formatMessage({id: 'account.cqzone'})}
                                             placeholder={intl.formatMessage({id: 'account.cqzone_placeholder'})}
                                        />
                                        <ProFormText
                                             width="md"
                                             required
                                             name="ituzone"
                                             initialValue={currentUser?.ituzone}
                                             label={intl.formatMessage({id: 'account.ituzone'})}
                                             placeholder={intl.formatMessage({id: 'account.ituzone_placeholder'})}
                                        />
                                   </ProForm.Group>
                                   <ProForm.Group>
                                        <ProFormText
                                             width="md"
                                             required
                                             name="callsign"
                                             label={intl.formatMessage({id: 'account.callsign'})}
                                             initialValue={currentUser?.callsign}
                                             placeholder={intl.formatMessage({id: 'account.callsign_placeholder'})}
                                        />
                                        <ProFormText
                                             width="md"
                                             required
                                             name="stationaddress"
                                             initialValue={currentUser?.stationaddress}
                                             label={intl.formatMessage({id: 'account.stationaddress'})}
                                             placeholder={intl.formatMessage({id: 'account.stationaddress_placeholder'})}
                                        />
                                   </ProForm.Group>
                                   <ProForm.Group>
                                        <ProFormText
                                             width="md"
                                             name="device"
                                             required
                                             label={intl.formatMessage({id: 'account.device'})}
                                             initialValue={currentUser?.device}
                                             placeholder={intl.formatMessage({id: 'account.device_placeholder'})}
                                        />
                                        <ProFormText
                                             width="md"
                                             name="antenna"
                                             initialValue={currentUser?.antenna}
                                             label={intl.formatMessage({id: 'account.antenna'})}
                                             required
                                             placeholder={intl.formatMessage({id: 'account.antenna_placeholder'})}
                                        />
                                        <ProFormText
                                             width="md"
                                             name="power"
                                             required
                                             initialValue={currentUser?.power}
                                             label={intl.formatMessage({id: 'account.power'})}
                                             placeholder={intl.formatMessage({id: 'account.power_placeholder'})}
                                        />
                                   </ProForm.Group>
                              </ModalForm>
                         </ProCard>
                         <ProCard 
                         title={intl.formatMessage({ id: 'frequency.manage' })}
                         headerBordered
                         tooltip={intl.formatMessage({ id: 'frequency.manage_placeholder' })}
                         gutter={{
                              xs: 8,
                              sm: 8,
                              md: 8,
                              lg: 8,
                              xl: 8,
                              xxl: 8,
                         }}
                         >
                              {/* 添加一条频率 */}
                              <EditableProTable<API.Frequency>
                              rowKey="id"
                              value={data || []}
                              columns={frequencyColumns}
                              request={getAllFrequency}
                              recordCreatorProps={{
                                   position: 'bottom',
                                   record: () => ({ id: (Math.random() * 1000000).toFixed(0) }),
                              }}
                              editable={{
                                   type: 'multiple',
                                   onSave: async (rowKey, data) => {
                                        delete data.id;
                                        delete data.index;
                                        const response = await addFrequency(data);
                                        if (response && response.code === 200) {
                                             message.success(response.message);
                                             window.location.reload();
                                        } else {
                                             message.error(response.message);
                                        }
                                   },
                                   actionRender: (_row, _config, dom) => [dom.save, dom.cancel],
                              }}
                              options={{}}
                              >
                              </EditableProTable>
                         </ProCard>
                    </ProCard>
               </PageContainer>
          </>
     )
};

export default Account;