import axios from "axios";

const baseURL = "ReimburseDestReact/";
// const baseURL = "https://0ec7af20trial-dev-reimbursement1-srv.cfapps.us10-001.hana.ondemand.com/odata/v4/my/";


const instance = axios.create({
  baseURL
});

export const getTableData = async (params = { $top: 100, $skip: 0 }) => {
  const { data } = await instance.get("/reimbursementheader", {
    params
  });

  return data.d?.results || data.d || data.value;
};

export const getGeneralInfo = async (reimbursmentId, IsActiveEntity) => {
  const { data } = await instance.get(`/reimbursementheader(reimbursmentId='${reimbursmentId}',IsActiveEntity=${IsActiveEntity})`);
  return data;
};

export const getReimbursementItems = async (reimbursmentId) => {
  const { data } = await instance.get(`/reimbursementitem?$filter=reimbursmentId eq '${reimbursmentId}'`);
  return data.d?.results || data.d || data.value;
};


export const getAttachment = async (reimbursmentId) => {
  const { data } = await instance.get(`/Files?$filter=reimbursmentId eq '${reimbursmentId}'`);
  return data.d?.results || data.d || data.value;
};

export const getReimbursementWorkflowItems = async (params = { $top: 100, $skip: 0 }) => {
  const { data } = await instance.get("/reimbursementWorkflow", {
    params
  });

  return data.d?.results || data.d || data.value;
};

export const getWorkflowItems = async (reimbursmentId) => {
  const { data } = await instance.get(`/workflow?$filter=reimbursmentId eq '${reimbursmentId}'`);

  return data.d?.results || data.d || data.value;
};

export const getComments = async (reimbursmentId) => {
  const { data } = await instance.get(`/comment?$filter=reimbursmentId eq '${reimbursmentId}'`);
  return data.d?.results || data.d || data.value || data;
};

export const getTableCount = async () => {
  const { data } = await instance.get("/reimbursementheader/$count");
  return data;
};

//Post

export const createReimbursement = async (payload) => {
  const { data } = await instance.post("/reimbursementheader", payload);
  return data;
};


export const postAttachment = async (payload) => {
  const { data } = await instance.post("/Files", payload);
  return data;
}

export const postWorkflowData = async (payload) => {
  try {
    const response = await instance.post("/workflow", payload); // Replace with actual URL
    return response.data;
  } catch (error) {
    console.error("Error posting workflow data:", error);
    throw error;
  }
};

//Patch
export const updateAttachments = async (ID, payload) => {
  if (!ID) {
    console.error("Cannot update attachment: Missing ID");
    return;
  }

  try {
    console.log(`Sending PATCH to /Files('${ID}') with payload:`, payload);
    const { data } = await instance.patch(`/Files('${ID}')`, payload);
    console.log("Update response:", data);
    return data;
  } catch (error) {
    console.error("Error updating attachments:", error);
  }
};


export const updateGeneralInfo = async (reimbursmentId, IsActiveEntity, payload) => {
  try {
    const { data } = await instance.patch(
      `/reimbursementheader(reimbursmentId='${reimbursmentId}',IsActiveEntity=${IsActiveEntity})`,
      payload
    );
    return data;
  } catch (error) {
    console.error("Error updating general information:", error);
  }
};

export const deleteAttachment = async (reimbursmentId, ID) => {
  const { data } = await instance.delete(`/Files(reimbursmentId='${reimbursmentId}',ID=${ID})`);
  return data;

}

export const deleteReimItems = async(reimbursmentId, item)=>{
  const {data} = await instance.delete(`/reimbursementitem(reimbursmentId='${reimbursmentId}',item='${item}',IsActiveEntity='true')`)
  return data;
}

export const FMbpaTrigger = async(id)=>{
  const {data} = await instance.get(`/asdf(id='${id}')`);
  return data;
}





