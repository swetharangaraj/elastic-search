import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
@Injectable({
  providedIn: 'root',
})
export class EsManagementService {
  constructor(private $http: HttpClient) {}

  getIndexStats = () => {
    return this.$http.get('/api/elastic/v1/getIndexStats');
  };

  getBaseDbTables = (baseDb: string) => {
    return this.$http.get(`/api/sqlSync/v1/listTables/${baseDb}`);
  };

  getTableFetchModeDbs = (baseDb: string, baseTableSelected: string) => {
    return this.$http.get(
      `api/sqlSync/v1/listDatabases/${baseDb}/${baseTableSelected}`
    );
  };

  descBaseTable = (baseDb: string, baseTableSelected: string) => {
    return this.$http.get(
      `api/sqlSync/v1/descBaseTable/${baseDb}/${baseTableSelected}`
    );
  };

  checkTadColumnEquivality = (
    baseDbTable: string,
    selectedTad: any,
    colsToBeIndexed: any
  ) => {
    return this.$http.post(`/api/sqlSync/v1/verifyBaseTadTableColumnEquiv`, {
      base_db_table: baseDbTable,
      selected_tad: selectedTad,
      columns_to_be_indexed: colsToBeIndexed,
    });
  };

  constructMappings = (data: any) => {
    return this.$http.post('/api/sqlSync/v1/constructMappings', {
      data: data,
    });
  };

  generatePipelines = (data: any) => {
    return this.$http.post('/api/pipeline/v1/constructPipeline', {
      data: data,
    });
  };

  createIndex = (index: string, mapping: any) => {
    return this.$http.post('/api/elastic/v1/createIndex', {
      index: index,
      mapping: mapping,
    });
  };

  createPipeline = (pipeline: any) => {
    return this.$http.post('/api/pipeline/v1/createPipeline', {
      pipeline: pipeline,
    });
  };

  createIndexInMongo = (doc: any) => {
    return this.$http.post('/api/elastic/v1/createIndexInMongo', {
      doc: doc,
    });
  };

  listOtherMysqlDatabases = () => {
    return this.$http.get(`/api/sqlSync/v1/listOtherMysqlDatabases`);
  };

  getMongoBaseCollections = () => {
    return this.$http.get('/api/mongoSync/v1/listBaseCollections');
  };

  getMongoAllDatabases = () => {
    return this.$http.get('/api/mongoSync/v1/getDatabases');
  };

  getcollectionExistenceResult = (tenant_dbs: any, collection_name: string) => {
    return this.$http.post(
      '/api/mongoSync/v1/checkCollectionExistInTenantDbs',
      {
        tenant_dbs: tenant_dbs,
        collection_name: collection_name,
      }
    );
  };

  createMongoPipelines(
    colToBeIndexed: any,
    fieldsToBeIndexed: any,
    selectedRoleGroups: any,
    routerUrl: string,
    executed_on: string
  ) {
    return this.$http.post('/api/mongoSync/v1/createMongoPipelines', {
      colToBeIndexed: colToBeIndexed,
      fieldsToBeIndexed: fieldsToBeIndexed,
      selectedRoleGroups: selectedRoleGroups,
      route_url: routerUrl,
      executed_on: executed_on,
    });
  }

  getMappings(filter: any) {
    return this.$http.post('/api/sqlSync/v1/getMappings', {
      filter: filter,
    });
  }

  getRoleGroups() {
    return this.$http.get('/api/role_mgmt/v1/getBaseDbRoleGroups');
  }

  getAllIndices() {
    return this.$http.get('/api/elastic/v1/getAllIndices');
  }

  getLogstashPipelines() {
    return this.$http.get('/api/pipeline/v1/listAllLogstashPipelines');
  }

  getMongoPipelines() {
    return this.$http.get('/api/pipeline/v1/listAllMongoPipelines');
  }

  getAllIndicesStats() {
    return this.$http.get('/api/elastic/v1/getIndicesStats');
  }

  deleteIndices(delete_info: any) {
    return this.$http.delete('/api/elastic/v1/deleteIndices', {
      body: { delete_info: delete_info },
    });
  }

  updateIndicesRoles(indices: any, roles: any) {
    return this.$http.put('/api/role_mgmt/v1/updateIndexRoles', {
      indices: indices,
      roles: roles,
    });
  }

  listCollectionsOfDatabase(database: string) {
    return this.$http.post('/api/mongoSync/v1/listCollectionsOfDatabase', {
      db_name: database,
    });
  }

  testQuery(queryString: string) {
    return this.$http.post('/api/sqlSync/v1/testQuery', {
      query_string: queryString,
    });
  }

  SyncBasePipelineWithTenants = (selected_pipelines:any, tenants:any) =>{
    return this.$http.post('/api/elastic/v1/SyncBasePipelineWithTenants', {
      selected_pipelines: selected_pipelines,
      tenants: tenants
    });
  }
 
  getActiveTenants = () =>{
    return this.$http.post("/api/sqlSync/v1/getActiveTenants",{})
  }


  syncIndexUiMap = (source_index:any, target_index:any) =>{
    return this.$http.post("/api/elastic/v1/syncIndexUiMap",{
      source_index:source_index,
      target_index:target_index
    })
  }


  getIndexConfigs = (index:string) =>{
    return this.$http.post("/api/elastic/v1/getIndexConfigs",{
      index:index
    })
  }
}
