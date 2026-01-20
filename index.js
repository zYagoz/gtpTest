import { client } from "../google-client/index.js";
import { enums } from "google-ads-api";
import { GoogleAdsSerive } from "./authenticate.js";

const googleService = new GoogleAdsSerive();

export const DateRange = Object.freeze({
    TODAY: 'TODAY',
    YESTERDAY: 'YESTERDAY',
    LAST_7_DAYS: 'LAST_7_DAYS',
    LAST_BUSINESS_WEEK: 'LAST_BUSINESS_WEEK',
    THIS_MONTH: 'THIS_MONTH',
    LAST_MONTH: 'LAST_MONTH',
    LAST_14_DAYS: 'LAST_14_DAYS',
    LAST_30_DAYS: 'LAST_30_DAYS',
    THIS_WEEK_SUN_TODAY: 'THIS_WEEK_SUN_TODAY',
    THIS_WEEK_MON_TODAY: 'THIS_WEEK_MON_TODAY',
    LAST_WEEK_SUN_SAT: 'LAST_WEEK_SUN_SAT',
    LAST_WEEK_MON_SUN: 'LAST_WEEK_MON_SUN',
});

export class Customer {
    constructor(customer_id) {
        this.customer = client.Customer({
            customer_id: customer_id,
            login_customer_id: process.env.LOGIN_CUSTOMER_ID,
            refresh_token: process.env.REFRESH_TOKEN,
        })
    }

    async getCampaingsQuery(range = DateRange.LAST_7_DAYS) {
        return await this.customer.query(`
  SELECT 
    campaign.id,
    campaign.name,
    campaign.status,
    campaign.primary_status_reasons,
    campaign.optimization_score,
    campaign.bidding_strategy_type,
    campaign.advertising_channel_type,
    campaign_budget.name,
    campaign_budget.amount_micros,
    campaign_budget.type,
    customer.currency_code,
    metrics.impressions,
    metrics.clicks,
    metrics.ctr,
    metrics.average_cpc,
    metrics.cost_micros,
    metrics.conversions,
    metrics.all_conversions,
    metrics.phone_calls,
    metrics.cost_per_conversion,
    metrics.conversions_from_interactions_rate,
    metrics.search_absolute_top_impression_share,
    metrics.search_top_impression_share,
    metrics.search_budget_lost_absolute_top_impression_share,
    metrics.search_budget_lost_top_impression_share,
    metrics.search_rank_lost_absolute_top_impression_share,
    metrics.search_rank_lost_top_impression_share
  FROM 
    campaign
  WHERE
    campaign.status = "ENABLED"
    AND segments.date during ${range}
    AND metrics.cost_micros > 1000000
  LIMIT 20
`);
    }

    async getAdGroupsQuery(campaign_id, range = DateRange.LAST_7_DAYS) {
        return await this.customer.query(`
        SELECT 
            ad_group.id,
            ad_group.name,
            ad_group.status,
            ad_group.type,
            ad_group.ad_rotation_mode,
            ad_group.cpc_bid_micros,
            ad_group.cpm_bid_micros,
            ad_group.target_cpa_micros,
            ad_group.target_roas,
            ad_group.percent_cpc_bid_micros,
            ad_group.effective_target_cpa_micros,
            ad_group.effective_target_roas,
            campaign.id,
            campaign.name,
            customer.currency_code,
            metrics.impressions,
            metrics.clicks,
            metrics.ctr,
            metrics.average_cpc,
            metrics.cost_micros,
            metrics.conversions,
            metrics.all_conversions,
            metrics.phone_calls,
            metrics.cost_per_conversion,
            metrics.conversions_from_interactions_rate,
            metrics.search_absolute_top_impression_share,
            metrics.search_top_impression_share,
            metrics.search_budget_lost_absolute_top_impression_share,
            metrics.search_budget_lost_top_impression_share,
            metrics.search_rank_lost_absolute_top_impression_share,
            metrics.search_rank_lost_top_impression_share
        FROM 
            ad_group
        WHERE
            campaign.id = ${campaign_id}
            AND ad_group.status = "ENABLED"
            AND segments.date DURING ${range}
        ORDER BY metrics.cost_micros DESC
        LIMIT 50
    `);
    }

    async getKeywordsQuery(campaign_id, ad_group_id = null, range = DateRange.LAST_7_DAYS) {
        let whereClause = `
        campaign.id = ${campaign_id}
        AND ad_group_criterion.status = "ENABLED"
        AND ad_group_criterion.type = "KEYWORD"
        AND segments.date DURING ${range}
    `;
        if (ad_group_id !== null && ad_group_id !== undefined) {
            whereClause += `
        AND ad_group.id = ${ad_group_id}`;
        }

        return await this.customer.query(`
        SELECT 
            ad_group_criterion.criterion_id,
            ad_group_criterion.keyword.text,
            ad_group_criterion.keyword.match_type,
            ad_group_criterion.status,
            ad_group_criterion.quality_info.quality_score,
            ad_group_criterion.quality_info.creative_quality_score,
            ad_group_criterion.quality_info.post_click_quality_score,
            ad_group_criterion.quality_info.search_predicted_ctr,
            ad_group_criterion.cpc_bid_micros,
            ad_group_criterion.effective_cpc_bid_micros,
            ad_group_criterion.position_estimates.first_page_cpc_micros,
            ad_group_criterion.position_estimates.top_of_page_cpc_micros,
            ad_group_criterion.position_estimates.first_position_cpc_micros,
            ad_group.id,
            ad_group.name,
            ad_group.status,
            campaign.id,
            campaign.name,
            customer.currency_code,
            metrics.impressions,
            metrics.clicks,
            metrics.ctr,
            metrics.average_cpc,
            metrics.cost_micros,
            metrics.conversions,
            metrics.all_conversions,
            metrics.cost_per_conversion,
            metrics.conversions_from_interactions_rate,
            metrics.search_absolute_top_impression_share,
            metrics.search_top_impression_share,
            metrics.search_budget_lost_absolute_top_impression_share,
            metrics.search_rank_lost_top_impression_share
        FROM 
            keyword_view
        WHERE
            ${whereClause}
        ORDER BY metrics.cost_micros DESC
        LIMIT 100
    `);
    }

async getAgeRangeQuery(campaign_id, ad_group_id = null, range = DateRange.LAST_7_DAYS) {
    let whereClause = `
        campaign.id = ${campaign_id}
        AND segments.date DURING ${range}
    `;
    
    if (ad_group_id !== null && ad_group_id !== undefined) {
        whereClause += `
        AND ad_group.id = ${ad_group_id}`;
    }

    return await this.customer.query(`
        SELECT 
            ad_group_criterion.age_range.type,
            ad_group_criterion.criterion_id,
            ad_group_criterion.status,
            ad_group_criterion.bid_modifier,
            ad_group.id,
            ad_group.name,
            ad_group.status,
            campaign.id,
            campaign.name,
            customer.currency_code,
            metrics.impressions,
            metrics.clicks,
            metrics.ctr,
            metrics.average_cpc,
            metrics.cost_micros,
            metrics.conversions,
            metrics.all_conversions,
            metrics.conversions_value,
            metrics.cost_per_conversion,
            metrics.conversions_from_interactions_rate
        FROM 
            age_range_view
        WHERE
            ${whereClause}
        ORDER BY metrics.impressions DESC
        LIMIT 100
    `);
}

// 2. Dados de GÊNERO
async getGenderQuery(campaign_id, ad_group_id = null, range = DateRange.LAST_7_DAYS) {
    let whereClause = `
        campaign.id = ${campaign_id}
        AND segments.date DURING ${range}
    `;
    
    if (ad_group_id !== null && ad_group_id !== undefined) {
        whereClause += `
        AND ad_group.id = ${ad_group_id}`;
    }

    return await this.customer.query(`
        SELECT 
            ad_group_criterion.gender.type,
            ad_group_criterion.criterion_id,
            ad_group_criterion.status,
            ad_group_criterion.bid_modifier,
            ad_group.id,
            ad_group.name,
            ad_group.status,
            campaign.id,
            campaign.name,
            customer.currency_code,
            metrics.impressions,
            metrics.clicks,
            metrics.ctr,
            metrics.average_cpc,
            metrics.cost_micros,
            metrics.conversions,
            metrics.all_conversions,
            metrics.conversions_value,
            metrics.cost_per_conversion,
            metrics.conversions_from_interactions_rate
        FROM 
            gender_view
        WHERE
            ${whereClause}
        ORDER BY metrics.impressions DESC
        LIMIT 100
    `);
}

async getIncomeRangeQuery(campaign_id, ad_group_id = null, range = DateRange.LAST_7_DAYS) {
    let whereClause = `
        campaign.id = ${campaign_id}
        AND segments.date DURING ${range}
    `;
    
    if (ad_group_id !== null && ad_group_id !== undefined) {
        whereClause += `
        AND ad_group.id = ${ad_group_id}`;
    }

    return await this.customer.query(`
        SELECT 
            ad_group_criterion.income_range.type,
            ad_group_criterion.criterion_id,
            ad_group_criterion.status,
            ad_group_criterion.bid_modifier,
            ad_group.id,
            ad_group.name,
            ad_group.status,
            campaign.id,
            campaign.name,
            customer.currency_code,
            metrics.impressions,
            metrics.clicks,
            metrics.ctr,
            metrics.average_cpc,
            metrics.cost_micros,
            metrics.conversions,
            metrics.all_conversions,
            metrics.conversions_value,
            metrics.cost_per_conversion,
            metrics.conversions_from_interactions_rate
        FROM 
            income_range_view
        WHERE
            ${whereClause}
        ORDER BY metrics.impressions DESC
        LIMIT 100
    `);
}


async getAllDemographicsQuery(campaign_id, ad_group_id = null, range = DateRange.LAST_7_DAYS) {
    const [ageData, genderData, incomeData] = await Promise.all([
        this.getAgeRangeQuery(campaign_id, ad_group_id, range),
        this.getGenderQuery(campaign_id, ad_group_id, range),
        this.getIncomeRangeQuery(campaign_id, ad_group_id, range)
    ]);

    return {
        age: ageData,
        gender: genderData,
        income: incomeData
    };
}
}

// const plano = new Customer(8689974096)

// console.log(await googleService.listAccounts())
// console.log(await plano.getCampaingsQuery())
// console.log(await plano.getAdGroupsQuery(23167708680))
// console.log(await plano.getKeywordsQuery(23167708680, 186122948846))
// console.log(await plano.getAllDemographicsQuery(23167708680, 186122948846))
