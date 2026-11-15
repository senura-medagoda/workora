package com.workora.jobapplication;

import com.jayway.jsonpath.JsonPath;
import com.workora.support.IntegrationTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class JobApplicationIntegrationTest extends IntegrationTestBase {

    private static final String BASE = "/api/v1/applications";

    private String alice;   // access token of user A
    private String bob;     // access token of user B

    @BeforeEach
    void createTwoUsers() throws Exception {
        alice = registerAndLogin("alice@example.com");
        bob = registerAndLogin("bob@example.com");
    }

    // ---------- helpers ----------

    private static String json(String company, String title, String status, String url) {
        return """
                {"companyName":"%s","jobTitle":"%s","location":"Colombo","jobUrl":"%s",
                 "status":"%s","appliedDate":"2026-11-10","notes":"Referred by a friend"}
                """.formatted(company, title, url, status);
    }

    private static String json(String company, String title, String status) {
        return json(company, title, status, "https://example.com/jobs/1");
    }

    /** Creates an application as the given user and returns its id. */
    private String create(String token, String body) throws Exception {
        MvcResult result = mockMvc.perform(post(BASE)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
    }

    // ---------- create ----------

    @Test
    @DisplayName("create returns 201 with a Location header and the stored data")
    void create_success() throws Exception {
        mockMvc.perform(post(BASE)
                        .header(HttpHeaders.AUTHORIZATION, bearer(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("Acme", "Java Developer", "APPLIED")))
                .andExpect(status().isCreated())
                .andExpect(header().exists(HttpHeaders.LOCATION))
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.companyName").value("Acme"))
                .andExpect(jsonPath("$.status").value("APPLIED"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.userId").doesNotExist());
    }

    @Test
    @DisplayName("every endpoint requires authentication")
    void withoutToken_returns401() throws Exception {
        mockMvc.perform(get(BASE)).andExpect(status().isUnauthorized());
        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON)
                .content(json("Acme", "Dev", "APPLIED"))).andExpect(status().isUnauthorized());
        mockMvc.perform(delete(BASE + "/" + UUID.randomUUID())).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("a blank company name is rejected with a field error")
    void create_blankCompany_returns400() throws Exception {
        mockMvc.perform(post(BASE)
                        .header(HttpHeaders.AUTHORIZATION, bearer(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("   ", "Dev", "APPLIED")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.companyName").exists());
    }

    @ParameterizedTest(name = "job url \"{0}\" is rejected")
    @ValueSource(strings = {"javascript:alert(1)", "ftp://example.com/file", "not a url", "data:text/html,hi"})
    void create_dangerousUrl_returns400(String badUrl) throws Exception {
        mockMvc.perform(post(BASE)
                        .header(HttpHeaders.AUTHORIZATION, bearer(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("Acme", "Dev", "APPLIED", badUrl)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.jobUrl").exists());
    }

    @Test
    @DisplayName("an unknown status value is rejected with 400, not 500")
    void create_unknownStatus_returns400() throws Exception {
        mockMvc.perform(post(BASE)
                        .header(HttpHeaders.AUTHORIZATION, bearer(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("Acme", "Dev", "HACKED")))
                .andExpect(status().isBadRequest());
    }

    // ---------- read ----------

    @Test
    @DisplayName("list contains only the caller's own applications")
    void list_isScopedToCurrentUser() throws Exception {
        create(alice, json("Alice Co 1", "Dev", "APPLIED"));
        create(alice, json("Alice Co 2", "Dev", "APPLIED"));
        create(bob, json("Bob Co", "Dev", "APPLIED"));

        String body = mockMvc.perform(get(BASE).header(HttpHeaders.AUTHORIZATION, bearer(alice)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andReturn().getResponse().getContentAsString();

        List<String> companies = JsonPath.read(body, "$.content[*].companyName");
        assertThat(companies).containsExactlyInAnyOrder("Alice Co 1", "Alice Co 2");
    }

    @Test
    @DisplayName("list can be filtered by status")
    void list_filtersByStatus() throws Exception {
        create(alice, json("A", "Dev", "APPLIED"));
        create(alice, json("B", "Dev", "OFFER"));

        mockMvc.perform(get(BASE).param("status", "OFFER").header(HttpHeaders.AUTHORIZATION, bearer(alice)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].companyName").value("B"));
    }

    @Test
    @DisplayName("pagination splits results into pages")
    void list_paginates() throws Exception {
        for (int i = 1; i <= 3; i++) {
            create(alice, json("Company " + i, "Dev", "APPLIED"));
        }

        mockMvc.perform(get(BASE).param("size", "2").header(HttpHeaders.AUTHORIZATION, bearer(alice)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2));
    }

    @ParameterizedTest(name = "size={0} is rejected")
    @ValueSource(strings = {"0", "-1", "51", "100000"})
    void list_invalidPageSize_returns400(String size) throws Exception {
        mockMvc.perform(get(BASE).param("size", size).header(HttpHeaders.AUTHORIZATION, bearer(alice)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("get returns 404 for an unknown id and 400 for a malformed id")
    void get_unknownAndMalformedId() throws Exception {
        mockMvc.perform(get(BASE + "/" + UUID.randomUUID()).header(HttpHeaders.AUTHORIZATION, bearer(alice)))
                .andExpect(status().isNotFound());
        mockMvc.perform(get(BASE + "/not-a-uuid").header(HttpHeaders.AUTHORIZATION, bearer(alice)))
                .andExpect(status().isBadRequest());
    }

    // ---------- update / status / delete ----------

    @Test
    @DisplayName("PUT replaces the editable fields")
    void update_success() throws Exception {
        String id = create(alice, json("Acme", "Junior Dev", "APPLIED"));

        mockMvc.perform(put(BASE + "/" + id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("Acme Corp", "Senior Dev", "INTERVIEWING")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName").value("Acme Corp"))
                .andExpect(jsonPath("$.jobTitle").value("Senior Dev"))
                .andExpect(jsonPath("$.status").value("INTERVIEWING"));
    }

    @Test
    @DisplayName("PATCH changes only the status")
    void updateStatus_success() throws Exception {
        String id = create(alice, json("Acme", "Dev", "APPLIED"));

        mockMvc.perform(patch(BASE + "/" + id + "/status")
                        .header(HttpHeaders.AUTHORIZATION, bearer(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"OFFER\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OFFER"))
                .andExpect(jsonPath("$.companyName").value("Acme"));
    }

    @Test
    @DisplayName("delete returns 204 and the application is gone")
    void delete_success() throws Exception {
        String id = create(alice, json("Acme", "Dev", "APPLIED"));

        mockMvc.perform(delete(BASE + "/" + id).header(HttpHeaders.AUTHORIZATION, bearer(alice)))
                .andExpect(status().isNoContent());
        mockMvc.perform(get(BASE + "/" + id).header(HttpHeaders.AUTHORIZATION, bearer(alice)))
                .andExpect(status().isNotFound());
    }

    // ---------- the critical one: users cannot touch each other's data ----------

    @Test
    @DisplayName("another user cannot read, edit, change the status of or delete my application (all 404)")
    void otherUsersApplication_isInvisibleAndUntouchable() throws Exception {
        String aliceId = create(alice, json("Alice Secret Co", "Dev", "APPLIED"));
        String url = BASE + "/" + aliceId;

        mockMvc.perform(get(url).header(HttpHeaders.AUTHORIZATION, bearer(bob)))
                .andExpect(status().isNotFound());

        mockMvc.perform(put(url).header(HttpHeaders.AUTHORIZATION, bearer(bob))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("Hijacked", "Hijacked", "REJECTED")))
                .andExpect(status().isNotFound());

        mockMvc.perform(patch(url + "/status").header(HttpHeaders.AUTHORIZATION, bearer(bob))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"REJECTED\"}"))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete(url).header(HttpHeaders.AUTHORIZATION, bearer(bob)))
                .andExpect(status().isNotFound());

        // Alice's record is completely unchanged
        mockMvc.perform(get(url).header(HttpHeaders.AUTHORIZATION, bearer(alice)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName").value("Alice Secret Co"))
                .andExpect(jsonPath("$.status").value("APPLIED"));
    }

    // ---------- stats ----------

    @Test
    @DisplayName("stats counts per status for the caller only, with zeros for empty statuses")
    void stats_countsPerStatus() throws Exception {
        create(alice, json("A", "Dev", "APPLIED"));
        create(alice, json("B", "Dev", "APPLIED"));
        create(alice, json("C", "Dev", "OFFER"));
        create(bob, json("D", "Dev", "REJECTED"));

        mockMvc.perform(get(BASE + "/stats").header(HttpHeaders.AUTHORIZATION, bearer(alice)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(3))
                .andExpect(jsonPath("$.byStatus.APPLIED").value(2))
                .andExpect(jsonPath("$.byStatus.OFFER").value(1))
                .andExpect(jsonPath("$.byStatus.REJECTED").value(0));
    }
}